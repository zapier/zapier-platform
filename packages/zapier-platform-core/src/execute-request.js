'use strict';

const _ = require('lodash');

const responseCleaner = require('./tools/response-cleaner');

const executeRequest = input => {
  const bundle = input._zapier.event.bundle || {};
  const options = _.extend({}, bundle.request || {});
  if (!options.url) {
    throw new Error('Missing url for request');
  }
  options.replace = true;
  return input.z.request(options).then(responseCleaner);
};

module.exports = executeRequest;
