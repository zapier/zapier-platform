'use strict';

const applyMiddleware = require('./middleware');
const ensureArray = require('./tools/ensure-array');

// before middlewares
const addBasicAuthHeader = require('./http-middlewares/before/add-basic-auth-header');
const addQueryParams = require('./http-middlewares/before/add-query-params');
const createInjectInputMiddleware = require('./http-middlewares/before/inject-input');
const prepareRequest = require('./http-middlewares/before/prepare-request');
const sanitizeHeaders = require('./http-middlewares/before/sanatize-headers');

const { REPLACE_CURLIES } = require('./constants');

// --- Helpers ---

const hasAuthPlaceholders = (obj) => {
  const s = JSON.stringify(obj);
  return /\{\{bundle\.authData\./.test(s) || /\{\{process\.env\./.test(s);
};

// Core's normalizeEmptyParamFields strips {{curlies}} from param values
// (designed for production where curlies are already resolved). In our
// placeholder survival test, this destroys placeholders. This function
// restores them by checking if empty param values correspond to known
// auth fields from placeholderAuthData.
const restoreStrippedParams = (template, placeholderAuthData) => {
  if (!template.params) {
    return;
  }
  for (const [key, value] of Object.entries(template.params)) {
    if (value === '' || value === null || value === undefined) {
      // Check if this key matches an authData field
      const placeholder = placeholderAuthData[key];
      if (
        placeholder &&
        typeof placeholder === 'string' &&
        placeholder.startsWith('{{')
      ) {
        template.params[key] = placeholder;
      } else {
        // Empty param that doesn't match any auth field — drop it.
        // These come from trigger URLs whose curlies were stripped.
        delete template.params[key];
      }
    }
  }
};

// Remove empty headers/params/body from a template object.
const cleanTemplate = (template) => {
  const cleaned = {};
  if (template.headers && Object.keys(template.headers).length > 0) {
    cleaned.headers = template.headers;
  }
  if (template.params && Object.keys(template.params).length > 0) {
    cleaned.params = template.params;
  }
  if (template.body && Object.keys(template.body).length > 0) {
    cleaned.body = template.body;
  }
  return cleaned;
};

// Build placeholder authData where each value IS its own placeholder string.
// When prepareRequest runs curlies resolution, placeholders resolve to themselves.
const buildPlaceholderAuthData = (auth) => {
  const authData = {};

  for (const field of auth.fields || []) {
    if (field.key) {
      authData[field.key] = `{{bundle.authData.${field.key}}}`;
    }
  }

  // Standard fields for known auth types (if not already declared)
  if (auth.type === 'basic') {
    authData.username = authData.username || '{{bundle.authData.username}}';
    authData.password = authData.password || '{{bundle.authData.password}}';
  }
  if (auth.type === 'oauth2') {
    authData.access_token =
      authData.access_token || '{{bundle.authData.access_token}}';
    if (
      auth.oauth2Config &&
      auth.oauth2Config.autoRefresh &&
      auth.oauth2Config.refreshAccessToken
    ) {
      authData.refresh_token =
        authData.refresh_token || '{{bundle.authData.refresh_token}}';
    }
  }
  // Session auth has no standard fields — all fields are user-declared.
  // Special case: some session auth apps store their token under
  // `access_token` even though it's not a declared field (it's set by
  // the session auth flow at runtime). Add a placeholder so middleware
  // that checks `bundle.authData.access_token` can produce a template.
  if (auth.type === 'session') {
    authData.access_token =
      authData.access_token || '{{bundle.authData.access_token}}';
    authData.sessionKey =
      authData.sessionKey || '{{bundle.authData.sessionKey}}';
    authData.token = authData.token || '{{bundle.authData.token}}';
    authData.accessToken =
      authData.accessToken || '{{bundle.authData.accessToken}}';
  }

  return authData;
};

// Check if template A is a superset of template B (all keys in B exist in A
// with the same values, but A may have extra keys).
const isSuperset = (a, b) => {
  if (!b || Object.keys(b).length === 0) {
    return true;
  }
  for (const section of ['headers', 'params', 'body']) {
    if (!b[section]) {
      continue;
    }
    if (!a[section]) {
      return false;
    }
    for (const [k, v] of Object.entries(b[section])) {
      if (a[section][k] !== v) {
        return false;
      }
    }
  }
  return true;
};

// Wrap placeholderAuthData in a Proxy that returns truthy values for any
// undeclared key accessed by middleware. Used for divergence detection:
// if middleware branches on undeclared authData fields, the Proxy run will
// produce a different template than the plain run.
const buildProxyAuthData = (placeholderAuthData) =>
  new Proxy(placeholderAuthData, {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      // Symbol properties (e.g. Symbol.toPrimitive) and internal props should pass through
      if (typeof prop === 'symbol') {
        return undefined;
      }
      return `__undeclared_${prop}__`;
    },
    has(target, prop) {
      // Make `'key' in authData` return true for any string key
      return typeof prop === 'string' || prop in target;
    },
  });

// Check if two templates are structurally equal (same keys and values).
const templatesEqual = (a, b) =>
  JSON.stringify(cleanTemplate(a)) === JSON.stringify(cleanTemplate(b));

// Create a String-like object whose comparison methods always return a fixed
// truthy/falsy result. Used to detect middleware that branches on request.url.
const createUrlProbe = (baseUrl, matchAll) => {
  const s = new String(baseUrl); // eslint-disable-line no-new-wrappers
  s.includes = () => matchAll;
  s.startsWith = () => matchAll;
  s.endsWith = () => matchAll;
  s.indexOf = () => (matchAll ? 0 : -1);
  s.search = () => (matchAll ? 0 : -1);
  s.match = () => (matchAll ? [baseUrl] : null);
  return s;
};

// Extract headers/params/body from a captured request, stripping defaults.
const extractTemplate = (req) => {
  const template = {};

  if (req.headers) {
    const headers = { ...req.headers };
    // Strip transport-level headers that shouldn't be in the auth template
    for (const key of Object.keys(headers)) {
      const lower = key.toLowerCase();
      if (lower === 'content-length') {
        delete headers[key];
      }
    }
    if (Object.keys(headers).length > 0) {
      template.headers = headers;
    }
  }

  // Check explicit params first, then extract from URL query string
  // (addQueryParams middleware moves params into the URL).
  const params =
    req.params && Object.keys(req.params).length > 0 ? { ...req.params } : {};

  if (Object.keys(params).length === 0 && req.url) {
    try {
      const parsed = new URL(req.url);
      for (const [k, v] of parsed.searchParams.entries()) {
        // Include params with auth placeholders or empty values (which
        // may have had curlies stripped by normalizeEmptyParamFields —
        // restoreStrippedParams will fix them later). Skip params with
        // non-placeholder, non-empty values (e.g., trigger-specific
        // filter params).
        if (
          v === '' ||
          /\{\{bundle\.authData\./.test(v) ||
          /\{\{process\.env\./.test(v)
        ) {
          params[k] = v;
        }
      }
    } catch {
      // URL might have unresolved placeholders
    }
  }

  if (Object.keys(params).length > 0) {
    template.params = params;
  }

  if (req.body) {
    template.body = req.body;
  }

  return template;
};

// --- Legacy scripting auth support ---
// Minimal reimplementation of the legacy scripting runner's beforeRequest
// middleware, just enough to inject auth fields into headers/params.
// Adapted from zapier-platform-legacy-scripting-runner/middleware-factory.js.

const renderLegacyTemplate = (templateString, context) => {
  if (typeof templateString !== 'string') {
    return templateString;
  }
  return templateString.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const trimmed = key.trim();
    return trimmed in context ? context[trimmed] : '';
  });
};

const renderAuthMapping = (authMapping, authData) => {
  if (!authMapping || Object.keys(authMapping).length === 0) {
    return authData;
  }
  const result = {};
  for (const [k, v] of Object.entries(authMapping)) {
    result[k] = renderLegacyTemplate(v, authData);
  }
  return result;
};

const createLegacyBeforeRequest = (app) => {
  const authType = app.authentication && app.authentication.type;
  const legacy = app.legacy || {};
  const authMapping =
    (legacy.authentication && legacy.authentication.mapping) || {};
  const placement =
    (legacy.authentication && legacy.authentication.placement) || 'header';

  return (req, z, bundle) => {
    const authData = bundle.authData || {};
    if (!authData || Object.keys(authData).length === 0) {
      return req;
    }

    if (authType === 'oauth2') {
      if (authData.access_token) {
        if (placement === 'header' || placement === 'both') {
          req.headers.Authorization =
            req.headers.Authorization || `Bearer ${authData.access_token}`;
        }
        if (placement === 'querystring' || placement === 'both') {
          req.params = req.params || {};
          req.params.access_token =
            req.params.access_token || authData.access_token;
        }
      }
    } else if (authType === 'session' || authType === 'custom') {
      const rendered = renderAuthMapping(authMapping, authData);
      if (placement === 'header' || placement === 'both') {
        const lowerHeaders = {};
        for (const [k, v] of Object.entries(req.headers)) {
          lowerHeaders[k.toLowerCase()] = v;
        }
        for (const [k, v] of Object.entries(rendered)) {
          if (!lowerHeaders[k.toLowerCase()]) {
            req.headers[k] = v;
          }
        }
      }
      if (placement === 'querystring' || placement === 'both') {
        req.params = req.params || {};
        for (const [k, v] of Object.entries(rendered)) {
          req.params[k] = req.params[k] || v;
        }
      }
    } else if (authType === 'basic' || authType === 'digest') {
      const username = renderLegacyTemplate(
        authMapping.username || '',
        authData,
      );
      const password = renderLegacyTemplate(
        authMapping.password || '',
        authData,
      );
      bundle.authData.username = username;
      bundle.authData.password = password;
    }

    return req;
  };
};

// Load the Zap object from legacy scriptingSource.
const loadLegacyZap = (compiledApp) => {
  const src = compiledApp.legacy && compiledApp.legacy.scriptingSource;
  if (!src) {
    return null;
  }
  const vm = require('vm');
  const sandbox = { Zap: {}, _: require('lodash'), z: { JSON }, $: {} };
  try {
    vm.runInNewContext(src, sandbox);
  } catch {
    return null;
  }
  return sandbox.Zap;
};

// Map typeOf + key to the pre-method name on the Zap object.
const getLegacyPreMethodName = (typeOf, key) => {
  if (!key) {
    return null;
  }
  switch (typeOf) {
    case 'trigger':
      return `${key}_pre_poll`;
    case 'create':
      return `${key}_pre_write`;
    case 'search':
      return `${key}_pre_search`;
    default:
      return null;
  }
};

// Get the operation URL from the legacy app config.
const getLegacyOperationUrl = (compiledApp, typeOf, key) => {
  const pluralType =
    typeOf === 'trigger'
      ? 'triggers'
      : typeOf === 'create'
        ? 'creates'
        : typeOf === 'search'
          ? 'searches'
          : null;
  if (!pluralType || !key) {
    return '';
  }
  const legacy = compiledApp.legacy || {};
  return (
    (legacy[pluralType] &&
      legacy[pluralType][key] &&
      legacy[pluralType][key].operation &&
      legacy[pluralType][key].operation.url) ||
    ''
  );
};

// Stub z object used for pipeline capture and test function survival.
const createStubZ = (compiledApp) => {
  const Zap = loadLegacyZap(compiledApp);

  const stubZ = {
    console: { log: () => {}, error: () => {}, warn: () => {} },
    errors: require('./errors'),
    JSON: { parse: JSON.parse, stringify: JSON.stringify },
    legacyScripting: {
      beforeRequest: createLegacyBeforeRequest(compiledApp),
      afterResponse: (response) => response,
      run: async (bundle, typeOf, key) => {
        // Build initial request with auth via the legacy beforeRequest
        let request = {
          url: getLegacyOperationUrl(compiledApp, typeOf, key),
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json; charset=utf-8',
          },
          params: {},
          body: {},
        };

        // Apply legacy auth middleware (adds Bearer token, etc.)
        const legacyBeforeRequest = createLegacyBeforeRequest(compiledApp);
        request = legacyBeforeRequest(request, stubZ, bundle);

        bundle.request = request;

        // Run the pre method (e.g., Zap.newForm_pre_poll) if it exists.
        // Wrap in try/catch — pre methods may crash on placeholder data
        // (e.g., accessing env vars or bundle fields that don't exist).
        // If it fails, proceed with the un-modified request.
        if (Zap && key) {
          const preMethodName = getLegacyPreMethodName(typeOf, key);
          const preMethod = preMethodName ? Zap[preMethodName] : null;
          if (preMethod) {
            try {
              const legacyBundle = {
                ...bundle,
                auth_fields: bundle.authData || {},
                request: { ...request },
              };
              const modified = await preMethod(legacyBundle);
              if (modified) {
                request = { ...request, ...modified };
              }
            } catch {
              // Pre method failed — continue with base request
            }
          }
        }

        // Make the stubbed HTTP request so it gets captured
        return stubZ.request(request);
      },
    },
    request: async () => ({
      status: 200,
      headers: {},
      data: {},
      content: '{}',
    }),
  };

  return stubZ;
};

// --- Survival routines ---

// Run placeholder authData through the beforeRequest middleware pipeline.
// Captures the prepared request right before it would be sent over HTTP.
// Returns { template, error? }.
const runPipelineSurvival = async (
  compiledApp,
  input,
  auth,
  placeholderAuthData,
  { url = 'https://example.com', urlProbe, reqOverrides = {} } = {},
) => {
  const syntheticInput = {
    _zapier: {
      ...input._zapier,
      event: {
        ...input._zapier.event,
        bundle: {
          authData: placeholderAuthData,
          inputData: {},
          meta: {},
        },
      },
    },
  };

  const httpBefores = [
    createInjectInputMiddleware(syntheticInput),
    prepareRequest,
  ];

  // When a urlProbe is provided, inject it after prepareRequest (which
  // stringifies the URL) but before the app's beforeRequest middleware.
  if (urlProbe) {
    httpBefores.push((req) => {
      req.url = urlProbe;
      return req;
    });
  }

  httpBefores.push(...ensureArray(compiledApp.beforeRequest));

  if (auth.type === 'basic') {
    httpBefores.push(addBasicAuthHeader);
  }

  httpBefores.push(sanitizeHeaders);
  httpBefores.push(addQueryParams);

  let capturedReq = null;
  const captureFunction = (preparedReq) => {
    capturedReq = preparedReq;
    return Promise.resolve({
      status: 200,
      headers: {},
      getHeader: () => undefined,
      content: '{}',
      data: {},
      request: preparedReq,
    });
  };

  const stubZ = createStubZ(compiledApp);
  const syntheticBundle = {
    authData: placeholderAuthData,
    inputData: {},
    meta: {},
  };

  const client = applyMiddleware(httpBefores, [], captureFunction, {
    skipEnvelope: true,
    extraArgs: [stubZ, syntheticBundle],
  });

  // Proxy process.env so middleware reading env vars (e.g.,
  // process.env.CLIENT_ID) gets a placeholder instead of undefined.
  const origEnv = process.env;
  process.env = new Proxy(origEnv, {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      if (typeof prop === 'symbol') {
        return undefined;
      }
      return `{{process.env.${prop}}}`;
    },
  });

  try {
    await client({
      method: 'GET',
      headers: {},
      params: {},
      ...reqOverrides,
      url,
      merge: true,
      [REPLACE_CURLIES]: true,
    });
  } catch (err) {
    return { template: {}, error: err.message };
  } finally {
    process.env = origEnv;
  }

  if (!capturedReq) {
    return { template: {} };
  }

  return { template: extractTemplate(capturedReq) };
};

// Run placeholder authData through authentication.test (when it's a function).
// Stubs z.request AND monkey-patches http/https/fetch to capture outbound requests.
// Returns { template, requestMade, error? }.
const runTestFunctionSurvival = async (
  testFn,
  placeholderAuthData,
  compiledApp,
  input,
) => {
  let capturedReq = null;

  const capture = (req) => {
    if (!capturedReq) {
      capturedReq = req;
    }
  };

  // Build a middleware-aware z.request stub that runs the beforeRequest
  // pipeline (just like the real z.request does), then captures the
  // prepared request instead of sending it over HTTP.
  const auth = compiledApp.authentication || {};
  const syntheticInput = {
    _zapier: {
      ...input._zapier,
      event: {
        ...input._zapier.event,
        bundle: {
          authData: placeholderAuthData,
          inputData: {},
          meta: {},
        },
      },
    },
  };

  const httpBefores = [
    createInjectInputMiddleware(syntheticInput),
    prepareRequest,
    ...ensureArray(compiledApp.beforeRequest),
  ];

  if (auth.type === 'basic') {
    httpBefores.push(addBasicAuthHeader);
  }
  httpBefores.push(sanitizeHeaders);
  httpBefores.push(addQueryParams);

  const captureFunction = (preparedReq) => {
    capture(preparedReq);
    return Promise.resolve({
      status: 200,
      headers: {},
      getHeader: () => undefined,
      content: '{}',
      data: {},
      request: preparedReq,
    });
  };

  const stubZ = createStubZ(compiledApp);
  const syntheticBundle = {
    authData: placeholderAuthData,
    inputData: {},
    meta: {},
  };

  const client = applyMiddleware(httpBefores, [], captureFunction, {
    skipEnvelope: true,
    extraArgs: [stubZ, syntheticBundle],
  });

  stubZ.request = async (reqOrUrl) => {
    const req =
      typeof reqOrUrl === 'string' ? { url: reqOrUrl } : { ...reqOrUrl };
    // Run through the beforeRequest middleware pipeline
    const response = await client({
      ...req,
      method: req.method || 'GET',
      headers: req.headers || {},
      params: req.params || {},
      merge: true,
      [REPLACE_CURLIES]: true,
    });
    return {
      ...response,
      throwForStatus: () => {},
      json: {},
    };
  };

  // Monkey-patch http.request, https.request, http.get, https.get
  const http = require('http');
  const https = require('https');

  const origHttpRequest = http.request;
  const origHttpsRequest = https.request;
  const origHttpGet = http.get;
  const origHttpsGet = https.get;

  const patchedRequest = (origFn, protocol) =>
    function patchedReq(...args) {
      // args can be (url, options, cb), (options, cb), or (url, cb)
      let options = {};
      const cb =
        typeof args[args.length - 1] === 'function'
          ? args[args.length - 1]
          : null;

      if (typeof args[0] === 'string' || args[0] instanceof URL) {
        const parsed = typeof args[0] === 'string' ? new URL(args[0]) : args[0];
        options =
          typeof args[1] === 'object' && args[1] !== null
            ? { url: parsed.href, ...args[1] }
            : { url: parsed.href };
      } else {
        options = args[0] || {};
      }

      capture({
        url:
          options.url ||
          `${protocol}://${options.host || options.hostname || 'localhost'}${options.path || '/'}`,
        headers: options.headers || {},
        method: options.method || 'GET',
      });

      // Return a no-op request that doesn't actually connect.
      // Use a real Readable stream so libraries that call .pipe() or
      // .setEncoding() (e.g. xmlrpc's SAX deserializer) work correctly.
      const { Readable } = require('stream');
      const { EventEmitter } = require('events');
      const fakeReq = new EventEmitter();
      fakeReq.write = () => {};
      fakeReq.end = () => {
        const body =
          '<?xml version="1.0"?><methodResponse><params>' +
          '<param><value><string>ok</string></value></param>' +
          '</params></methodResponse>';
        const fakeRes = new Readable({
          read() {
            this.push(body);
            this.push(null);
          },
        });
        fakeRes.statusCode = 200;
        fakeRes.headers = { 'content-type': 'text/xml' };
        if (cb) {
          cb(fakeRes);
        }
        fakeReq.emit('response', fakeRes);
      };
      fakeReq.setTimeout = () => fakeReq;
      fakeReq.destroy = () => {};
      return fakeReq;
    };

  http.request = patchedRequest(origHttpRequest, 'http');
  https.request = patchedRequest(origHttpsRequest, 'https');
  http.get = patchedRequest(origHttpGet, 'http');
  https.get = patchedRequest(origHttpsGet, 'https');

  // Monkey-patch global fetch
  const origFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const headers = init?.headers || input?.headers || {};
    capture({
      url,
      headers:
        headers instanceof Headers
          ? Object.fromEntries(headers.entries())
          : headers,
      method: init?.method || input?.method || 'GET',
    });
    return new Response('{}', { status: 200, headers: {} });
  };

  const bundle = {
    authData: placeholderAuthData,
    inputData: {},
    meta: {},
  };

  // Proxy process.env so middleware reading env vars gets placeholders.
  const origEnv = process.env;
  process.env = new Proxy(origEnv, {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      if (typeof prop === 'symbol') {
        return undefined;
      }
      return `{{process.env.${prop}}}`;
    },
  });

  try {
    await testFn(stubZ, bundle);
  } catch (err) {
    // If a request was captured before the error, use its template.
    // Many test functions crash parsing the stub response (e.g.,
    // accessing response.data.emails[0]) — that's fine, we already
    // have what we need.
    if (capturedReq) {
      return { template: extractTemplate(capturedReq), requestMade: true };
    }
    return { template: {}, requestMade: false, error: err.message };
  } finally {
    // Restore originals
    process.env = origEnv;
    http.request = origHttpRequest;
    https.request = origHttpsRequest;
    http.get = origHttpGet;
    https.get = origHttpsGet;
    globalThis.fetch = origFetch;
  }

  if (!capturedReq) {
    return { template: {}, requestMade: false };
  }

  return { template: extractTemplate(capturedReq), requestMade: true };
};

// --- Main command handler ---

const getAuthTemplate = async (compiledApp, input) => {
  const auth = compiledApp.authentication;
  const authType = auth ? auth.type : null;

  // No authentication defined — nothing to inject
  if (!auth) {
    return { supported: true, authType: null, source: 'none', template: {} };
  }

  // Digest and OAuth1 can't be expressed as static templates
  if (authType === 'digest') {
    return { supported: false, reason: 'digest', authType };
  }
  // if (authType === 'oauth1') {
  //   return { supported: false, reason: 'oauth1', authType };
  // }

  // --- Step 1: requestTemplate ---
  // If the app declares a requestTemplate, that IS the auth template.
  // No need to run middleware — requestTemplate is merged into every request.
  const requestTemplate = compiledApp.requestTemplate;
  if (requestTemplate && Object.keys(requestTemplate).length > 0) {
    const cleaned = cleanTemplate(requestTemplate);
    if (Object.keys(cleaned).length > 0) {
      return {
        supported: true,
        authType,
        source: 'requestTemplate',
        template: cleaned,
      };
    }
    // requestTemplate exists but has no useful content — fall through to Step 2
  }

  // --- Step 2: beforeRequest middleware ---
  // Run placeholder authData through the beforeRequest pipeline directly.
  // This captures auth injected by middleware (most common pattern).
  const beforeRequest = ensureArray(compiledApp.beforeRequest);
  if (beforeRequest.length > 0) {
    const placeholderAuthData = buildPlaceholderAuthData(auth);
    const { template, error } = await runPipelineSurvival(
      compiledApp,
      input,
      auth,
      placeholderAuthData,
    );

    if (error) {
      if (!auth.test) {
        return {
          supported: false,
          reason: 'middleware_not_convertible',
          authType,
          error,
        };
      }
      // beforeRequest errored but auth.test exists — fall through
    } else {
      restoreStrippedParams(template, placeholderAuthData);

      if (hasAuthPlaceholders(template)) {
        // Divergence check: authData proxy
        const proxyAuthData = buildProxyAuthData(placeholderAuthData);
        const { template: proxyTemplate, error: proxyError } =
          await runPipelineSurvival(compiledApp, input, auth, proxyAuthData);

        restoreStrippedParams(proxyTemplate, proxyAuthData);

        if (proxyError || !templatesEqual(template, proxyTemplate)) {
          if (!auth.test) {
            return {
              supported: false,
              reason: 'middleware_not_static',
              authType,
            };
          }
          // else: fall through to authentication.test
        } else {
          // URL divergence check
          const urlProbeTrue = createUrlProbe('https://example.com', true);
          const urlProbeFalse = createUrlProbe('https://example.com', false);
          const [
            { template: urlTrueTemplate, error: urlTrueError },
            { template: urlFalseTemplate, error: urlFalseError },
          ] = await Promise.all([
            runPipelineSurvival(compiledApp, input, auth, placeholderAuthData, {
              urlProbe: urlProbeTrue,
            }),
            runPipelineSurvival(compiledApp, input, auth, placeholderAuthData, {
              urlProbe: urlProbeFalse,
            }),
          ]);

          if (
            urlTrueError ||
            urlFalseError ||
            !templatesEqual(urlTrueTemplate, urlFalseTemplate)
          ) {
            // URL-conditional middleware detected. If the app has
            // authentication.test, fall through — the test function uses a
            // real API URL where the middleware will behave normally.
            if (!auth.test) {
              return {
                supported: false,
                reason: 'middleware_not_static',
                authType,
              };
            }
            // else: fall through to authentication.test steps
          } else {
            // beforeRequest succeeded. Store the template — if authentication.test
            // produces a superset (e.g., adds per-operation auth headers from
            // legacy scripting hooks), we'll prefer that instead.
            var beforeRequestTemplate = cleanTemplate(template); // eslint-disable-line no-var
          }
        } // end else (proxy check passed)
      }

      // No auth placeholders survived, or divergence with auth.test available.
      if (!auth.test) {
        return {
          supported: false,
          reason: 'middleware_not_convertible',
          authType,
        };
      }
    } // end else (no error)

    // beforeRequest couldn't produce a usable template — remember this so
    // that if authentication.test also fails, we return not-supported.
    var beforeRequestFailed = !beforeRequestTemplate; // eslint-disable-line no-var
  }

  // --- Step 3: authentication.test is an object (request config) ---
  // Run it through the beforeRequest pipeline just like core's
  // executeRequest does, so auth headers/params are included.
  if (auth.test && typeof auth.test !== 'function') {
    const placeholderAuthData = buildPlaceholderAuthData(auth);
    const testReq = auth.test;
    const { template, error } = await runPipelineSurvival(
      compiledApp,
      input,
      auth,
      placeholderAuthData,
      {
        url: testReq.url || 'https://example.com',
        reqOverrides: {
          method: testReq.method || 'GET',
          headers: testReq.headers || {},
          params: testReq.params || {},
          body: testReq.body,
        },
      },
    );

    if (error) {
      return {
        supported: false,
        reason: 'test_object_not_convertible',
        authType,
        error,
      };
    }

    const testReqOverrides = {
      method: testReq.method || 'GET',
      headers: testReq.headers || {},
      params: testReq.params || {},
      body: testReq.body,
    };

    restoreStrippedParams(template, placeholderAuthData);

    if (hasAuthPlaceholders(template)) {
      // Divergence checks: authData proxy + URL probe
      const proxyAuthData = buildProxyAuthData(placeholderAuthData);
      const { template: proxyTemplate, error: proxyError } =
        await runPipelineSurvival(compiledApp, input, auth, proxyAuthData, {
          url: testReq.url || 'https://example.com',
          reqOverrides: testReqOverrides,
        });

      restoreStrippedParams(proxyTemplate, proxyAuthData);

      if (proxyError || !templatesEqual(template, proxyTemplate)) {
        return { supported: false, reason: 'middleware_not_static', authType };
      }

      // URL divergence check — only when there's beforeRequest middleware
      // that could branch on URL. Skip if no beforeRequest (the test
      // object's own URL/params are static by definition).
      const hasBR = ensureArray(compiledApp.beforeRequest).length > 0;
      const urlProbeTrue = createUrlProbe(
        testReq.url || 'https://example.com',
        true,
      );
      const urlProbeFalse = createUrlProbe(
        testReq.url || 'https://example.com',
        false,
      );
      const [
        { template: urlTrueTemplate, error: urlTrueError },
        { template: urlFalseTemplate, error: urlFalseError },
      ] = await Promise.all([
        runPipelineSurvival(compiledApp, input, auth, placeholderAuthData, {
          urlProbe: urlProbeTrue,
          reqOverrides: testReqOverrides,
        }),
        runPipelineSurvival(compiledApp, input, auth, placeholderAuthData, {
          urlProbe: urlProbeFalse,
          reqOverrides: testReqOverrides,
        }),
      ]);

      if (
        hasBR &&
        (urlTrueError ||
          urlFalseError ||
          !templatesEqual(urlTrueTemplate, urlFalseTemplate))
      ) {
        return { supported: false, reason: 'middleware_not_static', authType };
      }

      // Merge back any params from the test object that were stripped
      // by core's normalizeEmptyParamFields (which removes curlies from
      // param values). The test object's params are static definitions.
      const finalTemplate = cleanTemplate(template);
      if (testReq.params && Object.keys(testReq.params).length > 0) {
        finalTemplate.params = { ...finalTemplate.params, ...testReq.params };
      }

      return {
        supported: true,
        authType,
        source: 'authentication.test',
        template: cleanTemplate(finalTemplate),
      };
    }

    return {
      supported: false,
      reason: 'test_object_not_convertible',
      authType,
    };
  }

  // --- Step 4: authentication.test is a function ---
  if (typeof auth.test === 'function') {
    const placeholderAuthData = buildPlaceholderAuthData(auth);
    const { template, requestMade, error } = await runTestFunctionSurvival(
      auth.test,
      placeholderAuthData,
      compiledApp,
      input,
    );

    if (error && !requestMade) {
      // Function crashed before making a request.
      if (beforeRequestFailed) {
        return {
          supported: false,
          reason: 'middleware_not_convertible',
          authType,
        };
      }
      // beforeRequest may have a template — handled at the end
    } else if (error) {
      // Request was made but function crashed after. If beforeRequest
      // has a template, prefer that over failing.
      if (!beforeRequestTemplate) {
        return {
          supported: false,
          reason: 'test_function_not_convertible',
          authType,
          error,
        };
      }
    } else if (!requestMade) {
      if (beforeRequestFailed) {
        return {
          supported: false,
          reason: 'middleware_not_convertible',
          authType,
        };
      }
      // beforeRequest may have a template — handled at the end
    } else {
      restoreStrippedParams(template, placeholderAuthData);

      if (hasAuthPlaceholders(template)) {
        // Divergence check: run again with Proxy authData
        const proxyAuthData = buildProxyAuthData(placeholderAuthData);
        const { template: proxyTemplate, error: proxyError } =
          await runTestFunctionSurvival(
            auth.test,
            proxyAuthData,
            compiledApp,
            input,
          );

        restoreStrippedParams(proxyTemplate, proxyAuthData);

        if (proxyError || !templatesEqual(template, proxyTemplate)) {
          return {
            supported: false,
            reason: 'test_function_not_static',
            authType,
          };
        }

        // No URL divergence check here — the test function used a real API
        // URL, so the captured template reflects normal request auth. URL
        // divergence is only checked in the beforeRequest fallback path
        // (which uses a synthetic URL).

        const testTemplate = cleanTemplate(template);

        // If beforeRequest also produced a template, pick the richer one.
        // The test function may capture per-operation auth (e.g., legacy
        // scripting hooks) that beforeRequest alone misses.
        if (
          beforeRequestTemplate &&
          !isSuperset(testTemplate, beforeRequestTemplate)
        ) {
          return {
            supported: true,
            authType,
            source: 'beforeRequest',
            template: beforeRequestTemplate,
          };
        }

        return {
          supported: true,
          authType,
          source: 'authentication.test',
          template: testTemplate,
        };
      }

      // Test function captured a request but no auth placeholders.
      // Fall back to beforeRequestTemplate if available.
      if (beforeRequestTemplate) {
        return {
          supported: true,
          authType,
          source: 'beforeRequest',
          template: beforeRequestTemplate,
        };
      }

      return {
        supported: false,
        reason: 'test_function_not_convertible',
        authType,
      };
    } // end else (requestMade)
  }

  // No authentication.test captured a request. Use beforeRequestTemplate
  // if available.
  if (beforeRequestTemplate) {
    return {
      supported: true,
      authType,
      source: 'beforeRequest',
      template: beforeRequestTemplate,
    };
  }

  return { supported: true, authType, source: 'none', template: {} };
};

module.exports = getAuthTemplate;
