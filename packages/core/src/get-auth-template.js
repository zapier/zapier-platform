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

const hasAuthPlaceholders = (obj) =>
  /\{\{bundle\.authData\./.test(JSON.stringify(obj));

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

  return authData;
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

// Extract headers/params/body from a captured request, stripping defaults.
const extractTemplate = (req) => {
  const template = {};

  if (req.headers) {
    const headers = { ...req.headers };
    // Strip transport-level headers that shouldn't be in the auth template
    for (const key of Object.keys(headers)) {
      const lower = key.toLowerCase();
      if (lower === 'user-agent' || lower === 'content-length') {
        delete headers[key];
      }
    }
    if (Object.keys(headers).length > 0) {
      template.headers = headers;
    }
  }

  if (req.params && Object.keys(req.params).length > 0) {
    template.params = req.params;
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

// Stub z object used for pipeline capture and test function survival.
const createStubZ = (compiledApp) => ({
  console: { log: () => {}, error: () => {}, warn: () => {} },
  errors: require('./errors'),
  JSON: { parse: JSON.parse, stringify: JSON.stringify },
  legacyScripting: {
    beforeRequest: createLegacyBeforeRequest(compiledApp),
    afterResponse: (response) => response,
    run: () => ({}),
  },
  request: async () => ({
    status: 200,
    headers: {},
    data: {},
    content: '{}',
  }),
});

// --- Survival routines ---

// Run placeholder authData through the beforeRequest middleware pipeline.
// Captures the prepared request right before it would be sent over HTTP.
// Returns { template, error? }.
const runPipelineSurvival = async (
  compiledApp,
  input,
  auth,
  placeholderAuthData,
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
    ...ensureArray(compiledApp.beforeRequest),
  ];

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

  try {
    await client({
      url: 'https://example.com',
      method: 'GET',
      headers: {},
      params: {},
      merge: true,
      [REPLACE_CURLIES]: true,
    });
  } catch (err) {
    return { template: {}, error: err.message };
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
) => {
  let capturedReq = null;

  const capture = (req) => {
    if (!capturedReq) {
      capturedReq = req;
    }
  };

  // Stub z.request
  const stubZ = createStubZ(compiledApp);
  stubZ.request = async (reqOrUrl) => {
    capture(typeof reqOrUrl === 'string' ? { url: reqOrUrl } : reqOrUrl);
    return {
      status: 200,
      headers: {},
      getHeader: () => undefined,
      throwForStatus: () => {},
      data: {},
      content: '{}',
      json: {},
      request: capturedReq,
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

  try {
    await testFn(stubZ, bundle);
  } catch (err) {
    return { template: {}, requestMade: !!capturedReq, error: err.message };
  } finally {
    // Restore originals
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
  if (authType === 'oauth1') {
    return { supported: false, reason: 'oauth1', authType };
  }

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

  const beforeRequest = ensureArray(compiledApp.beforeRequest);
  const hasBeforeRequest = beforeRequest.length > 0;

  // --- Step 2: beforeRequest middleware — placeholder survival ---
  if (hasBeforeRequest) {
    const placeholderAuthData = buildPlaceholderAuthData(auth);
    const { template, error } = await runPipelineSurvival(
      compiledApp,
      input,
      auth,
      placeholderAuthData,
    );

    if (error) {
      return {
        supported: false,
        reason: 'middleware_not_convertible',
        authType,
        error,
      };
    }

    if (hasAuthPlaceholders(template)) {
      // Divergence check: run again with Proxy authData that returns truthy
      // values for undeclared keys. If the template differs, middleware
      // branches on runtime authData we can't predict.
      const proxyAuthData = buildProxyAuthData(placeholderAuthData);
      const { template: proxyTemplate, error: proxyError } =
        await runPipelineSurvival(compiledApp, input, auth, proxyAuthData);

      if (proxyError || !templatesEqual(template, proxyTemplate)) {
        return {
          supported: false,
          reason: 'middleware_not_static',
          authType,
        };
      }

      return {
        supported: true,
        authType,
        source: 'beforeRequest',
        template: cleanTemplate(template),
      };
    }

    // --- Step 3b: placeholders did not survive ---
    return { supported: false, reason: 'middleware_not_convertible', authType };
  }

  // --- Step 3a: no beforeRequest ---
  // Either the app has no HTTP auth (DB connectors, no-auth apps),
  // or it uses inline auth (auth set in each perform/test function).

  // --- Step 4: authentication.test is an object (request config) ---
  if (auth.test && typeof auth.test !== 'function') {
    const template = {};

    if (auth.test.headers && typeof auth.test.headers === 'object') {
      template.headers = { ...auth.test.headers };
    }
    if (auth.test.params && typeof auth.test.params === 'object') {
      template.params = { ...auth.test.params };
    }

    return {
      supported: true,
      authType,
      source: 'authentication.test',
      template: cleanTemplate(template),
    };
  }

  // --- Step 5: authentication.test is a function ---
  if (typeof auth.test === 'function') {
    const placeholderAuthData = buildPlaceholderAuthData(auth);
    const { template, requestMade, error } = await runTestFunctionSurvival(
      auth.test,
      placeholderAuthData,
      compiledApp,
    );

    if (error && !requestMade) {
      // Function crashed before making a request — likely non-HTTP auth
      return { supported: true, authType, source: 'none', template: {} };
    }

    if (error) {
      return {
        supported: false,
        reason: 'test_function_not_convertible',
        authType,
        error,
      };
    }

    if (!requestMade) {
      // Test function didn't call z.request — no HTTP auth (e.g. DB connector)
      return { supported: true, authType, source: 'none', template: {} };
    }

    if (hasAuthPlaceholders(template)) {
      // Divergence check: run again with Proxy authData
      const proxyAuthData = buildProxyAuthData(placeholderAuthData);
      const { template: proxyTemplate, error: proxyError } =
        await runTestFunctionSurvival(auth.test, proxyAuthData, compiledApp);

      if (proxyError || !templatesEqual(template, proxyTemplate)) {
        return {
          supported: false,
          reason: 'test_function_not_static',
          authType,
        };
      }

      return {
        supported: true,
        authType,
        source: 'authentication.test',
        template: cleanTemplate(template),
      };
    }

    return {
      supported: false,
      reason: 'test_function_not_convertible',
      authType,
    };
  }

  // No authentication.test — no way to determine auth
  return { supported: true, authType, source: 'none', template: {} };
};

module.exports = getAuthTemplate;
