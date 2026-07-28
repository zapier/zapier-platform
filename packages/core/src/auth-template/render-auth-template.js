'use strict';

const applyMiddleware = require('../middleware');
const ensureArray = require('../tools/ensure-array');

// before middlewares
const addBasicAuthHeader = require('../http-middlewares/before/add-basic-auth-header');
const addQueryParams = require('../http-middlewares/before/add-query-params');
const createInjectInputMiddleware = require('../http-middlewares/before/inject-input');
const prepareRequest = require('../http-middlewares/before/prepare-request');
const oauth1SignRequest = require('../http-middlewares/before/oauth1-sign-request');
const sanitizeHeaders = require('../http-middlewares/before/sanatize-headers');

const { REPLACE_CURLIES } = require('../constants');
const { withHttpCapture } = require('./http-capture');
const { buildLegacyScripting } = require('./legacy-scripting');

/**
 * Extracts auth-contributed fields from the captured request by diffing
 * against the defaults that requestMerge adds.
 */
const extractTemplate = (capturedReq) => {
  const template = {};

  if (capturedReq.headers) {
    const headers = { ...capturedReq.headers };
    delete headers['user-agent'];
    if (Object.keys(headers).length > 0) {
      template.headers = headers;
    }
  }

  if (capturedReq.params && Object.keys(capturedReq.params).length > 0) {
    template.params = capturedReq.params;
  }

  if (capturedReq.body) {
    template.body = capturedReq.body;
  }

  return template;
};

/**
 * Render auth fields from authentication.test by replacing
 * {{bundle.authData.*}} placeholders with real credential values.
 */
const renderFromTest = (test, authData) => {
  const resolve = (value) => {
    if (typeof value !== 'string') {
      return value;
    }
    return value.replace(/\{\{bundle\.authData\.(\w+)\}\}/g, (match, key) =>
      authData[key] !== undefined ? authData[key] : match,
    );
  };

  const template = {};

  if (test.headers && typeof test.headers === 'object') {
    const headers = {};
    for (const [key, value] of Object.entries(test.headers)) {
      const resolved = resolve(value);
      if (resolved !== value) {
        headers[key] = resolved;
      }
    }
    if (Object.keys(headers).length > 0) {
      template.headers = headers;
    }
  }

  if (test.params && typeof test.params === 'object') {
    const params = {};
    for (const [key, value] of Object.entries(test.params)) {
      const resolved = resolve(value);
      if (resolved !== value) {
        params[key] = resolved;
      }
    }
    if (Object.keys(params).length > 0) {
      template.params = params;
    }
  }

  return template;
};

/**
 * renderAuthTemplate command handler.
 *
 * Runs the real HTTP middleware pipeline with actual credentials from
 * bundle.authData to produce a fully-rendered request.
 */
const renderAuthTemplate = async (compiledApp, input) => {
  const auth = compiledApp.authentication;
  if (!auth) {
    return { authType: null, template: {} };
  }

  const authType = auth.type;
  const eventBundle = input._zapier.event.bundle || {};

  // Ensure all bundle fields are populated so middleware doesn't crash
  // accessing e.g. bundle.inputData.someField or bundle.meta.isLoadingSample
  //
  // targetRequest carries the partner request being proxied. Signature-based
  // auth (AWS SigV4, OAuth1, HMAC) needs the real url/method/body to compute
  // a valid signature; absent it, the middleware runs against a stub and
  // produces a signature for the wrong request.
  const bundle = {
    authData: eventBundle.authData || {},
    inputData: eventBundle.inputData || {},
    meta: eventBundle.meta || {},
    subscribeData: eventBundle.subscribeData || {},
    targetUrl: eventBundle.targetUrl || '',
    targetRequest: eventBundle.targetRequest || null,
  };

  // Rebuild input with the fully-populated bundle so prepareRequest
  // (which reads from input._zapier.event.bundle) sees the defaults
  const safeInput = {
    _zapier: {
      ...input._zapier,
      event: {
        ...input._zapier.event,
        bundle,
      },
    },
  };

  // beforeRequest can be either a single function or an array; normalize
  // once and reuse below. (Function.length is the arity, not "is defined".)
  const beforeRequest = ensureArray(compiledApp.beforeRequest);

  // Build the same before-middleware chain as createAppRequestClient
  const httpBefores = [
    createInjectInputMiddleware(safeInput),
    prepareRequest,
    ...beforeRequest,
  ];

  if (authType === 'basic') {
    httpBefores.push(addBasicAuthHeader);
  } else if (authType === 'digest') {
    // Digest auth requires a challenge-response — can't capture statically,
    // but we still run the middleware for renderAuthTemplate.
    // For now, skip digest middleware since it makes a real HTTP request.
  } else if (authType === 'oauth1') {
    httpBefores.push(oauth1SignRequest);
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

  // Real z.request that hits the network. We have real authData here, so
  // beforeRequest that sends a request (e.g., refresh-token) and uses the
  // response in subsequent requests can produce the correct rendered template.
  // Goes directly to fetch instead of recursing through our middleware
  // pipeline — that would re-invoke beforeRequest for every sub-request and
  // likely loop. Real refresh-token-style middlewares call separate endpoints
  // that don't need the same auth applied.
  const realRequest = async (reqOrUrl) => {
    const req =
      typeof reqOrUrl === 'string' ? { url: reqOrUrl } : { ...reqOrUrl };
    const response = await fetch(req.url, {
      method: req.method || 'GET',
      headers: req.headers,
      body: req.body,
    });
    const content = await response.text();
    let data = {};
    try {
      data = JSON.parse(content);
    } catch {
      // response is not JSON — leave data empty
    }
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      getHeader: (name) => response.headers.get(name),
      content,
      data,
      throwForStatus: () => {
        if (response.status >= 400) {
          throw new Error(`Got ${response.status} ${response.statusText}`);
        }
      },
    };
  };

  const stubZ = {
    console: { log: () => {}, error: () => {}, warn: () => {} },
    errors: require('../errors'),
    JSON: { parse: JSON.parse, stringify: JSON.stringify },
    request: realRequest,
  };
  // Apps whose `beforeRequest` calls `z.legacyScripting.beforeRequest(...)`
  // need this stub. It applies the same auth-mapping logic getAuthTemplate
  // uses; for legacy basic-auth apps the Authorization header has already
  // been added by addBasicAuthHeader, so this is effectively a no-op there.
  stubZ.legacyScripting = buildLegacyScripting(compiledApp, realRequest);

  const client = applyMiddleware(httpBefores, [], captureFunction, {
    skipEnvelope: true,
    extraArgs: [stubZ, bundle],
  });

  const target = bundle.targetRequest || {};
  try {
    await client({
      url: target.url || 'https://example.com',
      method: target.method || 'GET',
      headers: target.headers || {},
      params: target.params || {},
      body: target.body,
      merge: true,
      [REPLACE_CURLIES]: true,
    });
  } catch (err) {
    return {
      authType,
      error: err.message,
      template: {},
    };
  }

  if (!capturedReq) {
    return {
      authType,
      template: {},
    };
  }

  const template = extractTemplate(capturedReq);

  // Inline auth fallback: if pipeline produced an empty template and
  // there's no middleware/requestTemplate, render from authentication.test
  const hasBeforeRequest = beforeRequest.length > 0;
  const hasRequestTemplate =
    compiledApp.requestTemplate &&
    Object.keys(compiledApp.requestTemplate).length > 0;

  if (
    !hasBeforeRequest &&
    !hasRequestTemplate &&
    Object.keys(template).length === 0 &&
    auth.test &&
    typeof auth.test !== 'function'
  ) {
    const rendered = renderFromTest(auth.test, bundle.authData);
    if (Object.keys(rendered).length > 0) {
      return { authType, template: rendered };
    }
  }

  // Inline auth + auth.test is a function: the pipeline can't see the
  // auth pattern because it lives inside operation.perform / auth.test
  // request configs. Invoke the test function with real authData,
  // capturing the prepared request via z.request and falling back to
  // raw http/fetch interception.
  if (
    !hasRequestTemplate &&
    Object.keys(template).length === 0 &&
    typeof auth.test === 'function'
  ) {
    let testCapturedReq = null;
    const testCapture = (preparedReq) => {
      if (!testCapturedReq) {
        testCapturedReq = preparedReq;
      }
      return Promise.resolve({
        status: 200,
        headers: {},
        getHeader: () => undefined,
        content: '{}',
        data: {},
        request: preparedReq,
      });
    };

    const testClient = applyMiddleware(httpBefores, [], testCapture, {
      skipEnvelope: true,
      extraArgs: [stubZ, bundle],
    });

    const testStubZ = {
      ...stubZ,
      request: async (reqOrUrl) => {
        const req =
          typeof reqOrUrl === 'string' ? { url: reqOrUrl } : { ...reqOrUrl };
        const response = await testClient({
          ...req,
          method: req.method || 'GET',
          headers: req.headers || {},
          params: req.params || {},
          merge: true,
          [REPLACE_CURLIES]: true,
        });
        return { ...response, throwForStatus: () => {}, json: {} };
      },
    };

    const onRawHttp = (httpReq) => {
      if (!testCapturedReq) {
        testCapturedReq = httpReq;
      }
    };

    try {
      await withHttpCapture(onRawHttp, () => auth.test(testStubZ, bundle));
    } catch (_err) {
      // testFn may crash parsing the stub response — continue with
      // whatever was captured before the crash.
    }

    if (testCapturedReq) {
      const inlineTemplate = extractTemplate(testCapturedReq);
      if (Object.keys(inlineTemplate).length > 0) {
        return { authType, template: inlineTemplate };
      }
    }
  }

  return {
    authType,
    template,
  };
};

module.exports = renderAuthTemplate;
