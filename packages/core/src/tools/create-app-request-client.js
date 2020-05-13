'use strict';

const _ = require('lodash');

const createRequestClient = require('./create-request-client');
const ensureArray = require('./ensure-array');
const ensurePath = require('./ensure-path');

// before middles
const addBasicAuthHeader = require('../http-middlewares/before/add-basic-auth-header');
const addDigestAuthHeader = require('../http-middlewares/before/add-digest-auth-header');
const addQueryParams = require('../http-middlewares/before/add-query-params');
const createInjectInputMiddleware = require('../http-middlewares/before/inject-input');
const disableSSLCertCheck = require('../http-middlewares/before/disable-ssl-cert-check');
const oauth1SignRequest = require('../http-middlewares/before/oauth1-sign-request');
const prepareRequest = require('../http-middlewares/before/prepare-request');

// after middles
const logResponse = require('../http-middlewares/after/log-response');
const prepareResponse = require('../http-middlewares/after/prepare-response');
const throwForStatus = require('../http-middlewares/after/throw-for-status');

const createAppRequestClient = (input, options) => {
  input = ensurePath(input, '_zapier.app');
  const app = input._zapier.app;

  options = _.defaults({}, options, {
    skipDefaultMiddle: true,
    extraArgs: [],
  });

  const httpBefores = [
    createInjectInputMiddleware(input),
    prepareRequest,
  ].concat(ensureArray(app.beforeRequest));

  if (app.authentication) {
    if (app.authentication.type === 'basic') {
      httpBefores.push(addBasicAuthHeader);
    } else if (app.authentication.type === 'digest') {
      httpBefores.push(addDigestAuthHeader);
    } else if (app.authentication.type === 'oauth1') {
      httpBefores.push(oauth1SignRequest);
    }
  }

  httpBefores.push(addQueryParams);

  const verifySSL = _.get(input, '_zapier.event.verifySSL');
  if (verifySSL === false) {
    httpBefores.push(disableSSLCertCheck);
  }

  const httpAfters = [
    prepareResponse,
    logResponse,
    ...ensureArray(app.afterResponse),
    throwForStatus,
  ];

  return createRequestClient(httpBefores, httpAfters, options);
};

module.exports = createAppRequestClient;
