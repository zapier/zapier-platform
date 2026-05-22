'use strict';

const applyMiddleware = require('../middleware');
const ensureArray = require('../tools/ensure-array');

// before middlewares
const addBasicAuthHeader = require('../http-middlewares/before/add-basic-auth-header');
const addQueryParams = require('../http-middlewares/before/add-query-params');
const createInjectInputMiddleware = require('../http-middlewares/before/inject-input');
const prepareRequest = require('../http-middlewares/before/prepare-request');
const sanitizeHeaders = require('../http-middlewares/before/sanatize-headers');

const { REPLACE_CURLIES } = require('../constants');
const { withHttpCapture } = require('./http-capture');
const { buildLegacyScripting, loadLegacyZap } = require('./legacy-scripting');

const errors = require('../errors');

// --- Helpers ---

// Opaque sentinels survive core's curly-stripping (normalizeEmptyParamFields)
// and any stringification middleware does. We embed them into placeholder
// authData / proxied process.env, then convert back to {{curlies}} on the
// way out (cleanTemplate). Lowercase-underscore markers are URL-safe in
// hostnames AND querystrings, so a sentinel survives substitution into
// any URL position without breaking `new URL(...)` parsing — which is
// what extractTemplate uses to recover params after addQueryParams.
const AUTH_SENTINEL_OPEN = '__placeholder_auth__';
const ENV_SENTINEL_OPEN = '__placeholder_env__';
const SENTINEL_CLOSE = '__end_placeholder__';
const wrapAuthSentinel = (key) =>
  `${AUTH_SENTINEL_OPEN}${key}${SENTINEL_CLOSE}`;
const wrapEnvSentinel = (key) => `${ENV_SENTINEL_OPEN}${key}${SENTINEL_CLOSE}`;
const AUTH_SENTINEL_RE = /__placeholder_auth__(.+?)__end_placeholder__/g;
const ENV_SENTINEL_RE = /__placeholder_env__(.+?)__end_placeholder__/g;

// Walk a template and replace sentinels with their {{curly}} equivalents.
// Returns a new object; the input is not mutated.
const sentinelsToCurlies = (value) => {
  if (typeof value === 'string') {
    return value
      .replace(AUTH_SENTINEL_RE, (_, k) => `{{bundle.authData.${k}}}`)
      .replace(ENV_SENTINEL_RE, (_, k) => `{{process.env.${k}}}`);
  }
  if (Array.isArray(value)) {
    return value.map(sentinelsToCurlies);
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = sentinelsToCurlies(v);
    }
    return out;
  }
  return value;
};

const hasAuthPlaceholders = (obj) => {
  const s = JSON.stringify(obj);
  return (
    s.includes(AUTH_SENTINEL_OPEN) ||
    s.includes(ENV_SENTINEL_OPEN) ||
    /\{\{\s*bundle\.authData\./.test(s) ||
    /\{\{\s*process\.env\./.test(s)
  );
};

// Check if auth field placeholders were consumed by encoding (e.g.,
// base64). Returns true if the template has placeholders but none of
// them are bundle.authData, AND the app has declared auth fields that
// should have survived.
// Build a supported:true result, but check if auth fields were consumed
// by encoding (e.g., base64). If so, override to supported:false.
//
// We only flag as consumed when the developer *explicitly declared*
// auth.fields. Implicit standard fields (basic's username/password,
// oauth2's access_token, etc.) aren't a strong "I expect this in the
// request" signal — apps may use process.env exclusively and never
// reference standard fields, which would be a false positive here.
const supportedResult = (authType, source, template, auth) => {
  if (template && Object.keys(template).length > 0) {
    const s = JSON.stringify(template);
    const hasAuthData = /\{\{\s*bundle\.authData\./.test(s);
    const hasProcessEnv = /\{\{\s*process\.env\./.test(s);
    const hasDeclaredFields =
      auth && auth.fields && auth.fields.some((f) => f.key);
    if (hasProcessEnv && !hasAuthData && hasDeclaredFields) {
      return { supported: false, reason: 'auth_fields_consumed', authType };
    }
  }
  return { supported: true, authType, source, template };
};

// Remove empty headers/params/body from a template object and convert
// any internal sentinels back to user-facing {{curly}} placeholders.
const cleanTemplate = (template) => {
  const cleaned = {};
  if (template.headers && Object.keys(template.headers).length > 0) {
    cleaned.headers = sentinelsToCurlies(template.headers);
  }
  if (template.params && Object.keys(template.params).length > 0) {
    cleaned.params = sentinelsToCurlies(template.params);
  }
  if (template.body && Object.keys(template.body).length > 0) {
    cleaned.body = sentinelsToCurlies(template.body);
  }
  return cleaned;
};

// Token-like authData keys that session-auth integrations populate at
// runtime via `sessionConfig.perform` without declaring them in
// `authentication.fields`. We add placeholders for these so middleware
// reading `bundle.authData.<key>` produces a template entry.
const SESSION_AUTH_COMMON_KEYS = [
  'PHPSESSID',
  'accessToken',
  'access_token',
  'apiToken',
  'refresh_token',
  'sessionKey',
  'sessionToken',
  'token',
];

// Credential keys that oidcFederation perform may return without declaring
// them in authentication.fields (AWS STS, GCP/Azure token exchange, Vault).
const OIDC_FEDERATION_COMMON_KEYS = [
  // AWS STS
  'accessKeyId',
  'secretAccessKey',
  'sessionToken',
  // GCP / Azure OAuth-style
  'access_token',
  'token_type',
  'expires_in',
  'expires_on',
  'token',
  // Vault
  'client_token',
  'accessor',
];

// Build placeholder authData where each value is an opaque sentinel
// string. Sentinels survive core's normalize/curly-stripping and any
// stringification middleware does, so the captured request still
// contains them verbatim. cleanTemplate converts sentinels back to
// {{bundle.authData.X}} on the way out.
const buildPlaceholderAuthData = (auth) => {
  const authData = {};

  for (const field of auth.fields || []) {
    if (field.key) {
      authData[field.key] = wrapAuthSentinel(field.key);
    }
  }

  // Standard fields for known auth types (if not already declared)
  if (auth.type === 'basic') {
    authData.username = authData.username || wrapAuthSentinel('username');
    authData.password = authData.password || wrapAuthSentinel('password');
  }
  if (auth.type === 'oauth2') {
    authData.access_token =
      authData.access_token || wrapAuthSentinel('access_token');
    if (
      auth.oauth2Config &&
      auth.oauth2Config.autoRefresh &&
      auth.oauth2Config.refreshAccessToken
    ) {
      authData.refresh_token =
        authData.refresh_token || wrapAuthSentinel('refresh_token');
    }
  }
  if (auth.type === 'oauth1') {
    authData.oauth_token =
      authData.oauth_token || wrapAuthSentinel('oauth_token');
    authData.oauth_token_secret =
      authData.oauth_token_secret || wrapAuthSentinel('oauth_token_secret');
  }
  if (
    auth.type === 'custom' &&
    auth.customConfig &&
    auth.customConfig.sendCode != null
  ) {
    authData.code = authData.code || wrapAuthSentinel('code');
  }
  // Session auth has no schema-defined standard fields, but some apps
  // stash their token under conventional undeclared names (set at
  // runtime by the session auth flow). Add placeholders for these so
  // middleware that reads `bundle.authData.<key>` can still produce a
  // template.
  if (auth.type === 'session') {
    for (const key of SESSION_AUTH_COMMON_KEYS) {
      authData[key] = authData[key] || wrapAuthSentinel(key);
    }
  }

  if (auth.type === 'oidcFederation') {
    for (const key of OIDC_FEDERATION_COMMON_KEYS) {
      authData[key] = authData[key] || wrapAuthSentinel(key);
    }
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

// Run fn with process.env proxied to return placeholders for unknown vars.
// Concurrent withProxiedEnv calls (e.g., parallel URL probe runs) must
// share the same proxy — naive "save current; restore current" would let
// the inner call save the outer's Proxy and "restore" to it, leaking the
// Proxy past the outermost finally.
let envProxyDepth = 0;
let realOrigEnv = null;
const withProxiedEnv = async (fn) => {
  if (envProxyDepth === 0) {
    realOrigEnv = process.env;
    process.env = new Proxy(realOrigEnv, {
      get(target, prop) {
        if (prop in target) {
          return target[prop];
        }
        if (typeof prop === 'symbol') {
          return undefined;
        }
        return wrapEnvSentinel(prop);
      },
    });
  }
  envProxyDepth++;
  try {
    return await fn();
  } finally {
    envProxyDepth--;
    if (envProxyDepth === 0) {
      process.env = realOrigEnv;
      realOrigEnv = null;
    }
  }
};

const buildSyntheticInput = (input, placeholderAuthData) => ({
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
});

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
        // Keep params that carry auth placeholders (sentinels survive
        // normalize; legacy {{curlies}} may also appear in user-written
        // requestTemplates that bypass substitution). Skip non-auth
        // literals like trigger-specific filter params.
        if (
          (typeof v === 'string' && v.includes(AUTH_SENTINEL_OPEN)) ||
          (typeof v === 'string' && v.includes(ENV_SENTINEL_OPEN)) ||
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

// Stub z object used for pipeline capture and test function survival.
const createStubZ = (compiledApp, cachedZap) => {
  const Zap = cachedZap !== undefined ? cachedZap : loadLegacyZap(compiledApp);

  const stubRequest = async () => ({
    status: 200,
    headers: {},
    data: {},
    content: '{}',
  });

  const stubZ = {
    console: { log: () => {}, error: () => {}, warn: () => {} },
    errors,
    JSON: { parse: JSON.parse, stringify: JSON.stringify },
    legacyScripting: buildLegacyScripting(
      compiledApp,
      (req) => stubZ.request(req),
      Zap,
    ),
    request: stubRequest,
  };

  return stubZ;
};

// --- Survival routines ---

// Run placeholder authData through the beforeRequest middleware pipeline.
// Captures the prepared request right before it would be sent over HTTP.
// Returns { template, error? }.
const runMiddlewareSurvival = async (
  compiledApp,
  input,
  auth,
  placeholderAuthData,
  { url = 'https://example.com', urlProbe, reqOverrides = {}, cachedZap } = {},
) => {
  const syntheticInput = buildSyntheticInput(input, placeholderAuthData);

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

  // After the app's beforeRequest runs, unwrap any urlProbe back to a plain
  // string. The probe's overridden comparison methods are intended to perturb
  // the app's beforeRequest only — leaving them in place perturbs downstream
  // core middlewares too (e.g., addQueryParams checks `url.includes('?')` to
  // pick its separator), which produces false-positive URL divergence.
  if (urlProbe) {
    httpBefores.push((req) => {
      if (req.url && typeof req.url !== 'string') {
        req.url = String(req.url);
      }
      return req;
    });
  }

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

  const stubZ = createStubZ(compiledApp, cachedZap);
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
    await withProxiedEnv(() =>
      client({
        method: 'GET',
        headers: {},
        params: {},
        ...reqOverrides,
        url,
        merge: true,
        [REPLACE_CURLIES]: true,
      }),
    );
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
  input,
) => {
  let capturedReq = null;

  const capture = (req) => {
    if (!capturedReq) {
      capturedReq = req;
    }
  };

  const auth = compiledApp.authentication || {};
  const syntheticInput = buildSyntheticInput(input, placeholderAuthData);

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

  const bundle = {
    authData: placeholderAuthData,
    inputData: {},
    meta: {},
  };

  try {
    await withHttpCapture(capture, () =>
      withProxiedEnv(() => testFn(stubZ, bundle)),
    );
  } catch (err) {
    // If a request was captured before the error, use its template.
    // Many test functions crash parsing the stub response (e.g.,
    // accessing response.data.emails[0]) — that's fine, we already
    // have what we need.
    if (capturedReq) {
      return { template: extractTemplate(capturedReq), requestMade: true };
    }
    return { template: {}, requestMade: false, error: err.message };
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

  // Digest can't be expressed as a static template (per-request nonce).
  // OAuth1 falls through — OAuth1 apps can implement a simplified static
  // template (e.g., Trello).
  if (authType === 'digest') {
    return { supported: false, reason: 'digest', authType };
  }

  // Basic auth always runs through addBasicAuthHeader, which base64-encodes
  // username:password. The encoding consumes the placeholder strings, so no
  // {{bundle.authData.X}} survives in the captured request. Our template
  // format has no way to express "base64-encode these fields at render
  // time," so basic auth is fundamentally unsupportable here.
  if (authType === 'basic') {
    return { supported: false, reason: 'basic', authType };
  }

  const placeholderAuthData = buildPlaceholderAuthData(auth);
  let beforeRequestTemplate;
  let beforeRequestFailed = false;

  const beforeRequest = ensureArray(compiledApp.beforeRequest);

  // --- Step 1: requestTemplate (only when there's no beforeRequest) ---
  // If the app declares a requestTemplate AND has no beforeRequest, that IS
  // the auth template — return it directly without running middleware.
  // When beforeRequest also exists, fall through to Step 2: prepareRequest
  // merges requestTemplate into the captured request, so the pipeline sees
  // the union of both contributions.
  const requestTemplate = compiledApp.requestTemplate;
  if (
    beforeRequest.length === 0 &&
    requestTemplate &&
    Object.keys(requestTemplate).length > 0
  ) {
    const cleaned = cleanTemplate(requestTemplate);
    // Return requestTemplate if it has auth placeholders or auth-like
    // header names. Skip if it only has non-auth headers (Accept,
    // Content-Type, User-Agent) — auth may come from beforeRequest or
    // authentication.test.
    const hasAuthContent =
      hasAuthPlaceholders(cleaned) ||
      (cleaned.headers &&
        Object.keys(cleaned.headers).some((k) => {
          const lower = k.toLowerCase();
          return (
            lower === 'authorization' ||
            lower.includes('api-key') ||
            lower.includes('apikey') ||
            lower.includes('token')
          );
        })) ||
      (cleaned.params && Object.keys(cleaned.params).length > 0);
    if (Object.keys(cleaned).length > 0 && hasAuthContent) {
      return supportedResult(authType, 'requestTemplate', cleaned, auth);
    }
    // requestTemplate has no auth content — fall through to Step 2
  }

  // --- Step 2: beforeRequest middleware ---
  // Run placeholder authData through the beforeRequest pipeline directly.
  // This captures auth injected by middleware (most common pattern).
  if (beforeRequest.length > 0) {
    const { template, error } = await runMiddlewareSurvival(
      compiledApp,
      input,
      auth,
      placeholderAuthData,
    );

    if (error) {
      if (!auth.test) {
        return {
          supported: false,
          reason: 'beforeRequest_error',
          authType,
          error,
        };
      }
      // beforeRequest errored but auth.test exists — fall through
    } else {
      if (hasAuthPlaceholders(template)) {
        // Divergence check: authData proxy
        const proxyAuthData = buildProxyAuthData(placeholderAuthData);
        const { template: proxyTemplate, error: proxyError } =
          await runMiddlewareSurvival(compiledApp, input, auth, proxyAuthData);

        if (proxyError || !templatesEqual(template, proxyTemplate)) {
          if (!auth.test) {
            return {
              supported: false,
              reason: 'beforeRequest_not_static',
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
            runMiddlewareSurvival(
              compiledApp,
              input,
              auth,
              placeholderAuthData,
              {
                urlProbe: urlProbeTrue,
              },
            ),
            runMiddlewareSurvival(
              compiledApp,
              input,
              auth,
              placeholderAuthData,
              {
                urlProbe: urlProbeFalse,
              },
            ),
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
                reason: 'beforeRequest_not_static',
                authType,
              };
            }
            // else: fall through to authentication.test steps
          } else {
            // beforeRequest succeeded. Store the template — if authentication.test
            // produces a superset (e.g., adds per-operation auth headers from
            // legacy scripting hooks), we'll prefer that instead.
            beforeRequestTemplate = cleanTemplate(template);
          }
        } // end else (proxy check passed)
      }

      // No auth placeholders survived (BR consumed them, e.g. base64
      // encoding) — or divergence was detected and we'd fall through if
      // auth.test were available.
      if (!auth.test) {
        return {
          supported: false,
          reason: 'auth_fields_consumed',
          authType,
        };
      }
    } // end else (no error)

    // beforeRequest couldn't produce a usable template — remember this so
    // that if authentication.test also fails, we return not-supported.
    beforeRequestFailed = !beforeRequestTemplate;
  }

  // --- Step 3: authentication.test is an object (request config) ---
  // Run it through the beforeRequest pipeline just like core's
  // executeRequest does, so auth headers/params are included.
  if (auth.test && typeof auth.test !== 'function') {
    const placeholderAuthData = buildPlaceholderAuthData(auth);
    const testReq = auth.test;
    const { template, error } = await runMiddlewareSurvival(
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
        reason: 'beforeRequest_error',
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

    if (hasAuthPlaceholders(template)) {
      // Divergence checks: authData proxy + URL probe
      const proxyAuthData = buildProxyAuthData(placeholderAuthData);
      const { template: proxyTemplate, error: proxyError } =
        await runMiddlewareSurvival(compiledApp, input, auth, proxyAuthData, {
          url: testReq.url || 'https://example.com',
          reqOverrides: testReqOverrides,
        });

      if (proxyError || !templatesEqual(template, proxyTemplate)) {
        return {
          supported: false,
          reason: 'beforeRequest_not_static',
          authType,
        };
      }

      // URL divergence check — only when there's beforeRequest middleware
      // that could branch on URL. Skip if no beforeRequest (the test
      // object's own URL/params are static by definition).
      const hasBR = beforeRequest.length > 0;
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
        runMiddlewareSurvival(compiledApp, input, auth, placeholderAuthData, {
          urlProbe: urlProbeTrue,
          reqOverrides: testReqOverrides,
        }),
        runMiddlewareSurvival(compiledApp, input, auth, placeholderAuthData, {
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
        return {
          supported: false,
          reason: 'beforeRequest_not_static',
          authType,
        };
      }

      return supportedResult(
        authType,
        'authentication.test',
        cleanTemplate(template),
        auth,
      );
    }

    return {
      supported: false,
      reason: 'auth_fields_consumed',
      authType,
    };
  }

  // --- Step 4: authentication.test is a function ---
  if (typeof auth.test === 'function') {
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
          reason: 'test_function_error',
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
          reason: 'test_function_error',
          authType,
          error,
        };
      }
    } else if (!requestMade) {
      if (beforeRequestFailed) {
        return {
          supported: false,
          reason: 'test_function_no_request',
          authType,
        };
      }
      // beforeRequest may have a template — handled at the end
    } else {
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
          return supportedResult(
            authType,
            'beforeRequest',
            beforeRequestTemplate,
            auth,
          );
        }

        return supportedResult(
          authType,
          'authentication.test',
          testTemplate,
          auth,
        );
      }

      if (beforeRequestTemplate) {
        return supportedResult(
          authType,
          'beforeRequest',
          beforeRequestTemplate,
          auth,
        );
      }

      return {
        supported: false,
        reason: 'auth_fields_consumed',
        authType,
      };
    } // end else (requestMade)
  }

  // No authentication.test captured a request. Use beforeRequestTemplate
  // if available.
  if (beforeRequestTemplate) {
    return supportedResult(
      authType,
      'beforeRequest',
      beforeRequestTemplate,
      auth,
    );
  }

  return { supported: true, authType, source: 'none', template: {} };
};

module.exports = getAuthTemplate;
