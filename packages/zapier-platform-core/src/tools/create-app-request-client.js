'use strict';

const _ = require('lodash');

const ensurePath = require('./ensure-path');
const ensureArray = require('./ensure-array');
const createRequestClient = require('./create-request-client');

// before middles
const createInjectInputMiddleware = require('../http-middlewares/before/inject-input');
const prepareRequest = require('../http-middlewares/before/prepare-request');
const addQueryParams = require('../http-middlewares/before/add-query-params');
const addBasicAuthHeader = require('../http-middlewares/before/add-basic-auth-header');
const disableSSLCertCheck = require('../http-middlewares/before/disable-ssl-cert-check');

// after middles
const prepareResponse = require('../http-middlewares/after/prepare-response');
const logResponse = require('../http-middlewares/after/log-response');
const throwForStaleAuth = require('../http-middlewares/after/throw-for-stale-auth');

const createAppRequestClient = (input, options) => {
  input = ensurePath(input, '_zapier.app');
  const app = input._zapier.app;

  options = _.defaults({}, options, {
    skipDefaultMiddle: true,
    extraArgs: []
  });

  const httpBefores = [
    createInjectInputMiddleware(input),
    prepareRequest
  ].concat(ensureArray(app.beforeRequest));

  if (app.authentication) {
    if (app.authentication.type === 'basic') {
      httpBefores.push(addBasicAuthHeader);
    } else if (app.authentication.type === 'digest') {
      console.warn('Digest Auth is not yet available');
    }
  }

  httpBefores.push(addQueryParams);

  const verifySSL = _.get(input, '_zapier.event.verifySSL');
  if (verifySSL === false) {
    httpBefores.push(disableSSLCertCheck);
  }

  const httpOriginalAfters = [prepareResponse, logResponse];

  if (app.authentication) {
    if (
      app.authentication.type === 'oauth2' &&
      _.get(app, 'authentication.oauth2Config.autoRefresh')
    ) {
      httpOriginalAfters.push(throwForStaleAuth);
    }
  }

  const httpAfters = httpOriginalAfters.concat(ensureArray(app.afterResponse));

  return createRequestClient(httpBefores, httpAfters, options);
};

module.exports = createAppRequestClient;
