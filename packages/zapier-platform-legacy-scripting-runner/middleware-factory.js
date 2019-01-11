const querystring = require('querystring');

const _ = require('lodash');

const renderTemplate = (templateString, context) => {
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

const createBeforeRequest = app => {
  const authType = _.get(app, 'authentication.type');
  const authMapping = _.get(app, 'legacy.authentication.mapping');
  const placement = _.get(app, 'legacy.authentication.placement') || 'header';

  const sessionAuthInHeader = (req, z, bundle) => {
    if (!_.isEmpty(bundle.authData)) {
      _.each(authMapping, (v, k) => {
        req.headers[k] = req.headers[k] || renderTemplate(v, bundle.authData);
      });
    }
    return req;
  };

  const sessionAuthInQuerystring = (req, z, bundle) => {
    if (!_.isEmpty(bundle.authData)) {
      _.each(authMapping, (v, k) => {
        req.params[k] = req.params[k] || renderTemplate(v, bundle.authData);
      });
    }
    return req;
  };

  const sessionAuthInBoth = (req, z, bundle) => {
    if (!_.isEmpty(bundle.authData)) {
      _.each(authMapping, (v, k) => {
        req.headers[k] = req.headers[k] || renderTemplate(v, bundle.authData);
        req.params[k] = req.params[k] || renderTemplate(v, bundle.authData);
      });
    }
    return req;
  };

  const getGrantType = req => {
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
      _.each(authMapping, (v, k) => {
        req.headers[k] = req.headers[k] || renderTemplate(v, bundle.authData);
      });
    }
    return req;
  };

  const apiKeyInQuerystring = (req, z, bundle) => {
    if (!_.isEmpty(bundle.authData)) {
      _.each(authMapping, (v, k) => {
        req.params[k] = req.params[k] || renderTemplate(v, bundle.authData);
      });
    }
    return req;
  };

  const basicDigestAuth = (req, z, bundle) => {
    if (!bundle._legacyBasicDigestAuthMiddlewareApplied) {
      const username = renderTemplate(
        authMapping.username || '',
        bundle.authData
      );
      const password = renderTemplate(
        authMapping.password || '',
        bundle.authData
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
      req.auth.oauth_consumer_key =
        req.auth.oauth_consumer_key || process.env.CLIENT_ID;
      req.auth.oauth_consumer_secret =
        req.auth.oauth_consumer_secret || process.env.CLIENT_SECRET;
      req.auth.oauth_token =
        req.auth.oauth_token || bundle.authData.oauth_token;
      req.auth.oauth_token_secret =
        req.auth.oauth_token_secret || bundle.authData.oauth_token_secret;
    }
    return req;
  };

  let beforeRequest;

  if (authType === 'session') {
    beforeRequest = {
      header: sessionAuthInHeader,
      querystring: sessionAuthInQuerystring,
      both: sessionAuthInBoth
    }[placement];
  } else if (authType === 'oauth2') {
    beforeRequest = {
      header: oauth2InHeader,
      querystring: oauth2InQuerystring,
      both: oauth2InBoth
    }[placement];
  } else if (authType === 'custom') {
    beforeRequest = {
      header: apiKeyInHeader,
      querystring: apiKeyInQuerystring
    }[placement];
  } else if (authType === 'basic' || authType === 'digest') {
    beforeRequest = basicDigestAuth;
  } else if (authType === 'oauth1') {
    beforeRequest = oauth1;
  }

  if (!beforeRequest) {
    beforeRequest = req => req;
  }
  return beforeRequest;
};

const createAfterResponse = app => {
  const authType = _.get(app, 'authentication.type');

  const sessionAuthCheckResponse = (response, z) => {
    if (response.status === 401) {
      throw new z.errors.RefreshAuthError('Session key needs refreshing');
    }
    return response;
  };

  let afterResponse;

  if (authType === 'session') {
    afterResponse = sessionAuthCheckResponse;
  }

  if (!afterResponse) {
    afterResponse = response => response;
  }
  return afterResponse;
};

module.exports = {
  createBeforeRequest,
  createAfterResponse
};
