'use strict';

const _ = require('lodash');

const fetch = require('./fetch');

// A stripped down version of fetch.
const request = (options) => {
  const url = options.url;
  options = _.pick(options, [
    'method',
    'headers',
    'body',
    'merge', // internal
    'replace', // internal
    'removeMissingValuesFrom', // internal
    'redirect',
    'follow',
    'compress',
    'counter',
    'agent',
    'timeout',
    'size',
  ]);

  return fetch(url, options).then((resp) => {
    resp.options = options;
    return resp;
  });
};

module.exports = request;
