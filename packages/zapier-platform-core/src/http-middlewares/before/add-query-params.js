'use strict';

const querystring = require('querystring');

// Take params off of req.params and append to url - "?a=1&b=2"".
// This middleware should run *after* custom middlewares, because
// custom middlewares might add params.
const addQueryParams = req => {
  if (Object.keys(req.params || {}).length) {
    const splitter = req.url.indexOf('?') === -1 ? '?' : '&';
    req.url += splitter + querystring.stringify(req.params);
  }
  delete req.params;
  return req;
};

module.exports = addQueryParams;
