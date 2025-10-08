const querystring = require('querystring');

const _ = require('lodash');

const renderTemplate = (templateString, context) => {
  // Security: Ensure templateString is a string and not user-controlled
  if (typeof templateString !== 'string') {
    throw new Error('Template string must be a string');
  }

  const re = /{{([^}]+)}}/g;

  // _.template doesn't allow us to set defaults, so we need to make sure all the
  // variables in templateString are defined (as empty strings) in context
  const defaults = _.clone(context);
  let match = re.exec(templateString);
  while (match) {
    const key = match[1].trim();
    defaults[key] = '';
    match = re.exec(templateString);
  }
  const finalContext = _.defaults(_.clone(context), defaults);

  const options = { interpolate: re };
  return _.template(templateString, options)(finalContext);
};

const getLowerHeaders = (headers) =>
  Object.entries(headers).reduce((result, [k, v]) => {
    result[k.toLowerCase()] = v;
    return result;
  }, {});

const renderAuthMapping = (authMapping, authData) => {
  if (_.isEmpty(authMapping)) {
    return authData;
  }
  return Object.entries(authMapping).reduce((result, [k, v]) => {
    result[k] = renderTemplate(v, authData);
    return result;
  }, {});
};

const applyAuthMappingInHeaders = (authMapping, req, authData) => {
  const rendered = renderAuthMapping(authMapping, authData);
  const lowerHeaders = getLowerHeaders(req.headers);
  Object.entries(rendered).forEach(([k, v]) => {
    const lowerKey = k.toLowerCase();
    if (!lowerHeaders[lowerKey]) {
      req.headers[k] = v;
    }
  });
};

const applyAuthMappingInQuerystring = (authMapping, req, authData) => {
  const rendered = renderAuthMapping(authMapping, authData);
  Object.entries(rendered).forEach(([k, v]) => {
    req.params[k] = req.params[k] || v;
  });
};

const createBeforeRequest = (app) => {
  const authType = _.get(app, 'authentication.type');
  const authMapping = _.get(app, 'legacy.authentication.mapping');
  const placement = _.get(app, 'legacy.authentication.placement') || 'header';

  const sessionAuthInHeader = (req, z, bundle) => {
    if (!_.isEmpty(bundle.authData)) {
      applyAuthMappingInHeaders(authMapping, req, bundle.authData);
    }
    return req;
  };

  const sessionAuthInQuerystring = (req, z, bundle) => {
    if (!_.isEmpty(bundle.authData)) {
      applyAuthMappingInQuerystring(authMapping, req, bundle.authData);
    }
    return req;
  };

  const sessionAuthInBoth = (req, z, bundle) => {
    if (!_.isEmpty(bundle.authData)) {
      applyAuthMappingInHeaders(authMapping, req, bundle.authData);
      applyAuthMappingInQuerystring(authMapping, req, bundle.authData);
    }
    return req;
  };

  const getGrantType = (req) => {
    const grantType = _.get(req, 'params.grant_type');
    if (grantType) {
      return grantType;
    }

    const contentType = req.headers['Content-Type'] || '';
    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(req.body).grant_type;
      } catch (err) {
        return null;
      }
    }
    return querystring.parse(req.body).grant_type;
  };

  const oauth2InHeader = (req, z, bundle) => {
    if (bundle.authData.access_token && getGrantType(req) !== 'refresh_token') {
      req.headers.Authorization =
        req.headers.Authorization || `Bearer ${bundle.authData.access_token}`;
    }
    return req;
  };

  const oauth2InQuerystring = (req, z, bundle) => {
    if (bundle.authData.access_token && getGrantType(req) !== 'refresh_token') {
      req.params.access_token =
        req.params.access_token || bundle.authData.access_token;
    }
    return req;
  };

  const oauth2InBoth = (req, z, bundle) => {
    if (bundle.authData.access_token && getGrantType(req) !== 'refresh_token') {
      req.headers.Authorization =
        req.headers.Authorization || `Bearer ${bundle.authData.access_token}`;
      req.params.access_token =
        req.params.access_token || bundle.authData.access_token;
    }
    return req;
  };

  const apiKeyInHeader = (req, z, bundle) => {
    if (!_.isEmpty(bundle.authData)) {
      applyAuthMappingInHeaders(authMapping, req, bundle.authData);
    }
    return req;
  };

  const apiKeyInQuerystring = (req, z, bundle) => {
    if (!_.isEmpty(bundle.authData)) {
      applyAuthMappingInQuerystring(authMapping, req, bundle.authData);
    }
    return req;
  };

  const basicDigestAuth = (req, z, bundle) => {
    if (!bundle._legacyBasicDigestAuthMiddlewareApplied) {
      const username = renderTemplate(
        authMapping.username || '',
        bundle.authData,
      );
      const password = renderTemplate(
        authMapping.password || '',
        bundle.authData,
      );
      bundle.authData.username = username;
      bundle.authData.password = password;
      bundle._legacyBasicDigestAuthMiddlewareApplied = true;
    }
    return req;
  };

  const oauth1 = (req, z, bundle) => {
    if (
      bundle.authData &&
      bundle.authData.oauth_token &&
      bundle.authData.oauth_token_secret
    ) {
      req.auth = req.auth || {};

      let templateContext;

      if (!req.auth.oauth_consumer_key) {
        templateContext = Object.assign({}, bundle.authData, bundle.inputData);
        req.auth.oauth_consumer_key = renderTemplate(
          process.env.CLIENT_ID,
          templateContext,
        );
      }
      if (!req.auth.oauth_consumer_secret) {
        if (!templateContext) {
          templateContext = Object.assign(
            {},
            bundle.authData,
            bundle.inputData,
          );
        }
        req.auth.oauth_consumer_secret = renderTemplate(
          process.env.CLIENT_SECRET,
          templateContext,
        );
      }

      req.auth.oauth_token =
        req.auth.oauth_token || bundle.authData.oauth_token;
      req.auth.oauth_token_secret =
        req.auth.oauth_token_secret || bundle.authData.oauth_token_secret;
    }
    return req;
  };

  let authBefore;

  if (authType === 'session') {
    authBefore = {
      header: sessionAuthInHeader,
      querystring: sessionAuthInQuerystring,
      both: sessionAuthInBoth,
    }[placement];
  } else if (authType === 'oauth2') {
    authBefore = {
      header: oauth2InHeader,
      querystring: oauth2InQuerystring,
      both: oauth2InBoth,
    }[placement];
  } else if (authType === 'custom') {
    authBefore = {
      header: apiKeyInHeader,
      querystring: apiKeyInQuerystring,
    }[placement];
  } else if (authType === 'basic' || authType === 'digest') {
    authBefore = basicDigestAuth;
  } else if (authType === 'oauth1') {
    authBefore = oauth1;
  }

  if (!authBefore) {
    authBefore = (req) => req;
  }

  const pruneEmptyBodyForGET = (req, z, bundle) => {
    if (req.allowGetBody && req.method === 'GET') {
      const contentType = req.headers['Content-Type'] || '';
      try {
        const parsedBody = contentType.includes('application/json')
          ? JSON.parse(req.body)
          : req.body;
        if (_.isEmpty(parsedBody)) {
          delete req.body;
        }
      } catch (err) {
        // Ignore
      }
    }
    return req;
  };

  return (req, z, bundle) => {
    req = authBefore(req, z, bundle);
    return pruneEmptyBodyForGET(req, z, bundle);
  };
};

const proxyHeaders = (headers) => {
  const proxy = {
    get: (target, prop) => {
      const original = Reflect.get(target, prop);
      if (typeof original === 'function' || typeof original === 'symbol') {
        // defaults to defined functions on the Headers class; the symbol type
        // is used for accessing an internal map
        return original;
      }
      try {
        // try to retrieve the header via the get() function
        return target.get(prop);
      } catch {
        // otherwise, default to original target[prop] value
        return original;
      }
    },
  };
  return new Proxy(headers, proxy);
};

const createAfterResponse = (app) => {
  const authType = _.get(app, 'authentication.type');
  const autoRefresh = _.get(app, 'authentication.oauth2Config.autoRefresh');

  const throwForStaleAuth = (response, z) => {
    if (response.status === 401) {
      throw new z.errors.RefreshAuthError('Authentication needs refreshing');
    }
    return response;
  };

  const makeHeaderCaseInsensitive = (response, z) => {
    response.headers = proxyHeaders(response.headers);
    return response;
  };

  let afterResponse;

  if (authType === 'session' || (authType === 'oauth2' && autoRefresh)) {
    afterResponse = throwForStaleAuth;
  }

  if (!afterResponse) {
    afterResponse = (response) => response;
  }

  return (response, z, bundle) => {
    response = afterResponse(response, z, bundle);
    return makeHeaderCaseInsensitive(response);
  };
};

module.exports = {
  createBeforeRequest,
  createAfterResponse,
  renderTemplate,
};
