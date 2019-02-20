'use strict';

const querystring = require('querystring');

const isCurlies = /{{.*?}}/g;
const shouldPruneQueryParam = value =>
  value === '' ||
  value === null ||
  value === undefined ||
  isCurlies.test(value);

// Mutates the object (it'll be deleted later anyway)
const pruneMissingQueryParams = params =>
  Object.keys(params).forEach(param => {
    if (shouldPruneQueryParam(params[param])) {
      delete params[param];
    }
  });

const hasQueryParams = ({ params = {} }) => Object.keys(params).length;

// Take params off of req.params and append to url - "?a=1&b=2"".
// This middleware should run *after* custom middlewares, because
// custom middlewares might add params.
const addQueryParams = req => {
  if (hasQueryParams(req)) {
    const splitter = req.url.includes('?') ? '&' : '?';

    if (req.removeMissingValuesFrom.params) {
      pruneMissingQueryParams(req.params);
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
