'use strict';

const _ = require('lodash');
const querystring = require('querystring');
const { replaceHeaders } = require('./middleware-utils');
const { FORM_TYPE } = require('../../tools/http');
const errors = require('../../errors');

const _throwForStatus = (response) => {
  // calling this always throws, regardless of the skipThrowForStatus value
  // eslint-disable-next-line yoda
  if (400 <= response.status && response.status < 600) {
    throw new errors.ResponseError(response);
  }
};

const prepareRawResponse = (resp, request) => {
  // TODO: if !2xx should we go ahead and get response.content for them?
  // retain the response signature for raw control
  const extendedResp = {
    request,
    skipThrowForStatus: request.skipThrowForStatus,
  };
  const outResp = _.extend(resp, extendedResp, replaceHeaders(resp));

  outResp.throwForStatus = () => {
    _throwForStatus(outResp);
  };

  Object.defineProperty(outResp, 'content', {
    get: function () {
      throw new Error(
        'You passed {raw: true} in request() - the response.content property is not ' +
          'available! Try response.body.pipe() for streaming, response.buffer() for a ' +
          'buffer, or response.text() for string.',
      );
    },
  });
  return outResp;
};

const prepareContentResponse = async (resp, request) => {
  // TODO: does it make sense to not trim the signature? more equivalence to raw...
  const content = await resp.text();

  // trim down the response signature a ton for simplicity
  const preppedResp = {
    url: resp.url,
    status: resp.status,
    redirected: resp.redirected,
    json: undefined,
    data: undefined,
    content,
    request,
    // only controls if _we_ call throwForStatus automatically
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

  outResp.throwForStatus = () => {
    _throwForStatus(outResp);
  };

  return outResp;
};

// Provide a standardized plain JS responseObj for common consumption, or raw response for streaming.
const prepareResponse = (resp) => {
  const request = resp.input;
  delete resp.input;

  const responseFunc = request.raw
    ? prepareRawResponse
    : prepareContentResponse;

  return responseFunc(resp, request);
};

module.exports = prepareResponse;
