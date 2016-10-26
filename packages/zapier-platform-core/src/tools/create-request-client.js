'use strict';

const _ = require('lodash');

const ensureArray = require('./ensure-array');
const request = require('./request-client');
const requestSugar = require('./request-sugar');
const applyMiddleware = require('../middleware');

// before middles
const prepareRequest = require('../http-middlewares/before/prepare-request');

// after middles
const prepareResponse = require('../http-middlewares/after/prepare-response');

const createRequestClient = (befores, afters, options) => {
  options = _.defaults({}, options, {
    skipDefaultMiddle: false,
    skipEnvelope: true,
    extraArgs: [],
  });

  const httpBefores = [];
  const httpAfters = [];

  if (!options.skipDefaultMiddle) {
    httpBefores.push(prepareRequest);
    httpAfters.push(prepareResponse);
  }

  const client = applyMiddleware(
    httpBefores.concat(ensureArray(befores)),
    httpAfters.concat(ensureArray(afters)),
    request,
    options
  );
  return requestSugar.addUrlOrOptions(client);
};

module.exports = createRequestClient;
