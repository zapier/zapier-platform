'use strict';

const applyMiddleware = require('./middleware');
const ensureArray = require('./tools/ensure-array');

// before middlewares
const addBasicAuthHeader = require('./http-middlewares/before/add-basic-auth-header');
const addQueryParams = require('./http-middlewares/before/add-query-params');
const createInjectInputMiddleware = require('./http-middlewares/before/inject-input');
const prepareRequest = require('./http-middlewares/before/prepare-request');
const oauth1SignRequest = require('./http-middlewares/before/oauth1-sign-request');
const sanitizeHeaders = require('./http-middlewares/before/sanatize-headers');

const { REPLACE_CURLIES } = require('./constants');

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
  const bundle = {
    authData: eventBundle.authData || {},
    inputData: eventBundle.inputData || {},
    meta: eventBundle.meta || {},
    subscribeData: eventBundle.subscribeData || {},
    targetUrl: eventBundle.targetUrl || '',
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

  // Build the same before-middleware chain as createAppRequestClient
  const httpBefores = [
    createInjectInputMiddleware(safeInput),
    prepareRequest,
    ...ensureArray(compiledApp.beforeRequest),
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

  const stubZ = {
    console: { log: () => {}, error: () => {}, warn: () => {} },
    errors: require('./errors'),
    JSON: { parse: JSON.parse, stringify: JSON.stringify },
    request: async () => ({
      status: 200,
      headers: {},
      data: {},
      content: '{}',
    }),
  };

  const client = applyMiddleware(httpBefores, [], captureFunction, {
    skipEnvelope: true,
    extraArgs: [stubZ, bundle],
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
  const hasBeforeRequest =
    Array.isArray(compiledApp.beforeRequest) &&
    compiledApp.beforeRequest.length > 0;
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

  return {
    authType,
    template,
  };
};

module.exports = renderAuthTemplate;
