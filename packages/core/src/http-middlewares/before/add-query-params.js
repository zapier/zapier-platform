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

    let stringifiedParams = querystring.stringify(req.params);

    // it goes against spec, but for compatibility, some APIs want certain
    // characters (mostly $) unencoded
    if (req.skipEncodingChars) {
      for (let i = 0; i < req.skipEncodingChars.length; i++) {
        const char = req.skipEncodingChars.charAt(i);
        const valToReplace = querystring.escape(char);
        if (valToReplace === char) {
          continue;
        }
        // no replaceAll in JS yet, coming in a node version soon!
        stringifiedParams = stringifiedParams.replace(
          new RegExp(valToReplace, 'g'),
          char,
        );
      }
    }

    if (stringifiedParams) {
      req.url += `${splitter}${stringifiedParams}`;
    }
  }

  delete req.params;
  return req;
};

module.exports = addQueryParams;
