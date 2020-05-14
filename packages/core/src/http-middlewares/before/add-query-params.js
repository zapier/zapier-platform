'use strict';

const querystring = require('querystring');
const { normalizeEmptyParamFields } = require('../../tools/cleaner');

const hasQueryParams = ({ params = {} }) => Object.keys(params).length;

// Take params off of req.params and append to url - "?a=1&b=2"".
// This middleware should run *after* custom middlewares, because
// custom middlewares might add params.
const addQueryParams = (req) => {
  if (hasQueryParams(req)) {
    const splitter = req.url.includes('?') ? '&' : '?';

    normalizeEmptyParamFields(req);

    const stringifiedParams = querystring.stringify(req.params);

    if (stringifiedParams) {
      req.url += `${splitter}${stringifiedParams}`;
    }
  }

  delete req.params;
  return req;
};

module.exports = addQueryParams;
