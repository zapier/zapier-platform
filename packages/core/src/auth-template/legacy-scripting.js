'use strict';

const vm = require('vm');
const lodash = require('lodash');

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
    } else if (
      authType === 'session' ||
      authType === 'custom' ||
      authType === 'oidcFederation'
    ) {
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
      // Only override username/password when the legacy authMapping
      // explicitly defines them. Otherwise preserve the values the user
      // already provided so addBasicAuthHeader (later in the pipeline)
      // can use them.
      if (authMapping.username) {
        bundle.authData.username = renderLegacyTemplate(
          authMapping.username,
          authData,
        );
      }
      if (authMapping.password) {
        bundle.authData.password = renderLegacyTemplate(
          authMapping.password,
          authData,
        );
      }
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
  const sandbox = { Zap: {}, _: lodash, z: { JSON }, $: {} };
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

// Build a `legacyScripting` object suitable for stubZ that mirrors what
// production's legacy-scripting-runner provides for `z.legacyScripting`:
// - `beforeRequest(req, z, bundle)` applies the legacy auth mapping.
// - `afterResponse` is a no-op.
// - `run(bundle, typeOf, key)` builds the operation URL, applies legacy
//   auth, optionally runs the pre method (e.g., `<key>_pre_poll`), and
//   delegates to `requestFn` to actually capture/send the request.
//
// `requestFn` is called as `requestFn(request)` and should return a
// response-shaped object.
const buildLegacyScripting = (compiledApp, requestFn, cachedZap) => {
  const Zap = cachedZap !== undefined ? cachedZap : loadLegacyZap(compiledApp);
  const legacyBeforeRequest = createLegacyBeforeRequest(compiledApp);

  return {
    beforeRequest: legacyBeforeRequest,
    afterResponse: (response) => response,
    run: async (bundle, typeOf, key) => {
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
      request = legacyBeforeRequest(request, null, bundle);
      bundle.request = request;

      // Run the pre method (e.g., Zap.newForm_pre_poll) if it exists.
      // Wrap in try/catch — pre methods may crash on placeholder data
      // (e.g., accessing env vars or bundle fields that don't exist).
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

      return requestFn(request);
    },
  };
};

module.exports = {
  buildLegacyScripting,
  createLegacyBeforeRequest,
  loadLegacyZap,
};
