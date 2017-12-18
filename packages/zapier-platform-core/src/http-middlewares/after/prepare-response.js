'use strict';

const _ = require('lodash');
const throwForStatus = require('./throw-for-status');

// prepare headers object - plain object for serialization later
const plainHeaders = headers => {
  const _headers = {};
  headers.forEach((value, name) => {
    _headers[name] = value;
  });
  return _headers;
};

// Return the normal resp.headers, but with more goodies (toJSON support).
const replaceHeaders = resp => {
  const getHeader = name => resp.headers.get(name);

  Object.defineProperty(resp.headers, 'toJSON', {
    enumerable: false,
    value: () => plainHeaders(resp.headers)
  });

  return {
    headers: resp.headers,
    getHeader
  };
};

const prepareRawResponse = (resp, request) => {
  // TODO: if !2xx should we go ahead and get response.content for them?
  // retain the response signature for raw control
  const extendedResp = {
    request: request
  };
  const outResp = _.extend(resp, extendedResp, replaceHeaders(resp));
  outResp.throwForStatus = () => throwForStatus(outResp) && undefined;
  Object.defineProperty(outResp, 'content', {
    get: function() {
      throw new Error(
        'You passed {raw: true} in request() - the response.content property is not ' +
          'available! Try response.body.pipe() for streaming, response.buffer() for a ' +
          'buffer, or response.text() for string.'
      );
    }
  });
  return outResp;
};

const prepareContentResponse = (resp, request) => {
  // TODO: does it make sense to not trim the signature? more equivalence to raw...
  return resp.text().then(content => {
    // trim down the response signature a ton for simplicity
    let json;
    try {
      json = JSON.parse(content);
    } catch (err) {
      json = undefined;
    }
    const preppedResp = {
      status: resp.status,
      json: json,
      content: content,
      request: request
    };
    const outResp = _.extend(preppedResp, replaceHeaders(resp));
    outResp.throwForStatus = () => throwForStatus(outResp) && undefined;
    return outResp;
  });
};

// Provide a standardized plain JS responseObj for common consumption, or raw response for streaming.
const prepareResponse = resp => {
  const request = resp.input;
  delete resp.input;

  if (request.raw) {
    return prepareRawResponse(resp, request);
  } else {
    return prepareContentResponse(resp, request);
  }
};

module.exports = prepareResponse;
