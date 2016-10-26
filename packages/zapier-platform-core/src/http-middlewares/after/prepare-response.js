'use strict';

const _ = require('lodash');

// prepare headers object - plain object for serialization later
const plainHeaders = (headers) => {
  const _headers = {};
  headers.forEach((value, name) => {
    _headers[name] = value;
  });
  return _headers;
};

const replaceHeaders = (resp) => {
  const getHeader = (name) => resp.headers.get(name);

  Object.defineProperty(resp.headers, 'toJSON', {
    enumerable: false,
    value: () => plainHeaders(resp.headers)
  });

  return {
    headers: resp.headers,
    getHeader
  };
};

/*
   Provide a standardized plain JS responseObj for common consumption.

   We might have to provide facilities for raw resps (IE: streaming binary data).
*/
const prepareResponse = (resp) => {
  const request = resp.input;
  delete resp.input;

  if (request.raw) {
    // TODO: if !2xx should we go ahead and get response.content for them?
    // retain the response signature for raw control
    const preppedResp = _.extend(resp, {request: request}, replaceHeaders(resp));
    Object.defineProperty(preppedResp, 'content', {
      get: function() {
        throw new Error(
          'You passed {raw: true} in request() - the response.content property is not ' +
          'available! Try response.body.pipe() for streaming, response.buffer() for a ' +
          'buffer, or response.text() for string.'
        );
      }
    });
    return preppedResp;
  } else {
    // TODO: does it make sense to not trim the signature? more equivalence to raw...
    return resp.text()
      .then((content) => {
        // trim down the response signature a ton for simplicity
        const preppedResp = {
          status: resp.status,
          content: content,
          request: request,
        };
        return _.extend(preppedResp, replaceHeaders(resp));
      });
  }
};

module.exports = prepareResponse;
