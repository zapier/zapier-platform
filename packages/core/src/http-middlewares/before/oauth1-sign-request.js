'use strict';

const crypto = require('crypto');
const urllib = require('url');
const querystring = require('querystring');

const _ = require('lodash');
const oauth = require('oauth-sign');

const { getContentType, FORM_TYPE } = require('../../tools/http');

const stripQueryFromUrl = (url) => {
  const u = new urllib.URL(url);
  return `${u.protocol}//${u.host}${u.pathname}`;
};

const collectAuthParams = (req) => {
  const params = _.omit(req.auth, [
    'oauth_consumer_secret',
    'oauth_token_secret',
  ]);
  _.defaults(params, {
    oauth_version: '1.0A',
    oauth_signature_method: 'HMAC-SHA1',
    oauth_nonce: crypto.randomBytes(20).toString('hex'),
    oauth_timestamp: Math.floor(Date.now() / 1000),
  });
  return params;
};

// Implements https://tools.ietf.org/html/rfc5849#section-3.4.1.3.1
const collectParamsForBaseString = (req, authParams) => {
  const params = _.clone(authParams);

  const makeArrayOnDupeKey = (objValue, srcValue) => {
    if (Array.isArray(objValue)) {
      if (Array.isArray(srcValue)) {
        return objValue.concat(srcValue);
      }
      objValue.push(srcValue);
      return objValue;
    }

    if (Array.isArray(srcValue)) {
      return [objValue].concat(srcValue);
    }
    if (objValue === undefined) {
      return srcValue;
    }
    return [objValue, srcValue];
  };

  _.extendWith(params, req.params, makeArrayOnDupeKey);
  _.extendWith(
    params,
    querystring.parse(new urllib.URL(req.url).search.substr(1)),
    makeArrayOnDupeKey,
  );

  if (req.body && getContentType(req.headers) === FORM_TYPE) {
    _.extendWith(params, querystring.parse(req.body), makeArrayOnDupeKey);
  }

  return params;
};

const buildAuthorizationHeader = (params) => {
  const paramList = _.map(
    params,
    (v, k) => `${oauth.rfc3986(k)}="${oauth.rfc3986(v)}"`,
  );
  return `OAuth ${paramList.join(',')}`;
};

const oauth1SignRequest = (req) => {
  if (!_.isEmpty(req.auth)) {
    const signMethod = req.auth.oauth_signature_method || 'HMAC-SHA1';
    const authParams = collectAuthParams(req);
    const paramsForBaseString = collectParamsForBaseString(req, authParams);
    authParams.oauth_signature = oauth.sign(
      signMethod,
      req.method,
      stripQueryFromUrl(req.url),
      paramsForBaseString,
      req.auth.oauth_consumer_secret,
      req.auth.oauth_token_secret,
    );

    // Implements https://tools.ietf.org/html/rfc5849#section-3.5.1
    req.headers.Authorization = buildAuthorizationHeader(authParams);

    // TODO: Form-encoded body (section 3.5.2) and querystring (3.5.3)?
  }
  return req;
};

module.exports = oauth1SignRequest;
