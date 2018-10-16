'use strict';

const querystring = require('querystring');

// Mutates the object (it'll be deleted later anyway)
const removeEmptyParams = params =>
  Object.keys(params).map(param => {
    if (
      params[param] === '' ||
      params[param] === null ||
      typeof params[param] === 'undefined'
    ) {
      delete params[param];
    }
  });

// Take params off of req.params and append to url - "?a=1&b=2"".
// This middleware should run *after* custom middlewares, because
// custom middlewares might add params.
const addQueryParams = req => {
  if (Object.keys(req.params || {}).length) {
    const splitter = req.url.indexOf('?') === -1 ? '?' : '&';

    if (req.omitEmptyParams) {
      removeEmptyParams(req.params);
    }

    const stringifiedParams = querystring.stringify(req.params);

    if (stringifiedParams) {
      req.url += `${splitter}${stringifiedParams}`;
    }
  }
  delete req.params;
  return req;
};

module.exports = addQueryParams;
