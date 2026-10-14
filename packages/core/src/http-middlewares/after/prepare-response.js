'use strict';

const _ = require('lodash');
const querystring = require('querystring');

const { scrub, findSensitiveValues } = require('@zapier/secret-scrubber');

const { replaceHeaders } = require('./middleware-utils');
const { FORM_TYPE } = require('../../tools/http');
const errors = require('../../errors');
const {
  findSensitiveValuesFromAuthData,
} = require('../../tools/secret-scrubber');

const buildSensitiveValues = (bundle) => {
  const authData = bundle?.authData || {};
  const result = [
    ...findSensitiveValuesFromAuthData(authData),
    ...findSensitiveValues(process.env),
  ];
  return [...new Set(result)];
};

const _throwForStatus = (response, bundle) => {
  // calling this always throws, regardless of the skipThrowForStatus value
  // eslint-disable-next-line yoda
  if (400 <= response.status && response.status < 600) {
    // Create a cleaned version of the response to avoid sensitive data leaks
    try {
      // Find sensitive values from environment variables and bundle authData
      const sensitiveValues = buildSensitiveValues(bundle);
      if (sensitiveValues.length > 0 && response?.request?.url) {
        response.request.url = scrub(response.request.url, sensitiveValues);
      }
    } catch (err) {
      // don't fail the whole request if we can't scrub for some reason
    }
    throw new errors.ResponseError(response);
  }
};

const prepareRawResponse = (resp, request, bundle) => {
  // TODO: if !2xx should we go ahead and get response.content for them?
  // retain the response signature for raw control
  const extendedResp = {
    request,
    skipThrowForStatus: request.skipThrowForStatus,
  };
  const outResp = _.extend(resp, extendedResp, replaceHeaders(resp));

  outResp.throwForStatus = () => {
    _throwForStatus(outResp, bundle);
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

const prepareContentResponse = async (resp, request, bundle) => {
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
    _throwForStatus(outResp, bundle);
  };

  return outResp;
};

// Provide a standardized plain JS responseObj for common consumption, or raw response for streaming.
const prepareResponse = (resp, z, bundle) => {
  const request = resp.input;
  delete resp.input;

  const responseFunc = request.raw
    ? prepareRawResponse
    : prepareContentResponse;

  return responseFunc(resp, request, bundle);
};

module.exports = prepareResponse;
