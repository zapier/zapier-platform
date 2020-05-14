'use strict';

const _ = require('lodash');
const querystring = require('querystring');
const throwForStatus = require('./throw-for-status');
const { replaceHeaders } = require('./middleware-utils');
const { FORM_TYPE } = require('../../tools/http');

const prepareRawResponse = (resp, request) => {
  // TODO: if !2xx should we go ahead and get response.content for them?
  // retain the response signature for raw control
  const extendedResp = {
    request: request,
    skipThrowForStatus: request.skipThrowForStatus,
  };
  const outResp = _.extend(resp, extendedResp, replaceHeaders(resp));
  outResp.throwForStatus = () => throwForStatus(outResp) && undefined;
  Object.defineProperty(outResp, 'content', {
    get: function () {
      throw new Error(
        'You passed {raw: true} in request() - the response.content property is not ' +
          'available! Try response.body.pipe() for streaming, response.buffer() for a ' +
          'buffer, or response.text() for string.'
      );
    },
  });
  return outResp;
};

const prepareContentResponse = (resp, request) => {
  // TODO: does it make sense to not trim the signature? more equivalence to raw...
  return resp.text().then((content) => {
    // trim down the response signature a ton for simplicity
    const preppedResp = {
      status: resp.status,
      json: undefined,
      data: undefined,
      content: content,
      request: request,
      skipThrowForStatus: request.skipThrowForStatus,
    };
    const outResp = _.extend(preppedResp, replaceHeaders(resp));
    try {
      if (outResp.headers.get('content-type') === FORM_TYPE) {
        outResp.data = querystring.parse(content);
      } else {
        outResp.data = JSON.parse(content);
        outResp.json = JSON.parse(content); // DEPRECATED (not using reference to isolate)
      }
    } catch (_e) {}
    outResp.throwForStatus = () => throwForStatus(outResp) && undefined;
    return outResp;
  });
};

// Provide a standardized plain JS responseObj for common consumption, or raw response for streaming.
const prepareResponse = (resp) => {
  const request = resp.input;
  delete resp.input;

  if (request.raw) {
    return prepareRawResponse(resp, request);
  } else {
    return prepareContentResponse(resp, request);
  }
};

module.exports = prepareResponse;
