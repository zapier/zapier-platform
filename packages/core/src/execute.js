'use strict';

const _ = require('lodash');

const addQueryParams = require('./http-middlewares/before/add-query-params');
const ensureArray = require('./tools/ensure-array');
const injectInput = require('./http-middlewares/before/inject-input');
const prepareRequest = require('./http-middlewares/before/prepare-request');
const ZapierPromise = require('./tools/promise');

const constants = require('./constants');

const executeHttpRequest = (input, options) => {
  options = _.extend({}, options, constants.REQUEST_OBJECT_SHORTHAND_OPTIONS);
  return input.z.request(options).then((response) => {
    if (response.data === undefined) {
      throw new Error(
        'Response needs to be JSON, form-urlencoded or parsed in middleware.'
      );
    }
    return response.data;
  });
};

const executeInputOutputFields = (inputOutputFields, input) => {
  inputOutputFields = ensureArray(inputOutputFields);

  return ZapierPromise.all(
    inputOutputFields.map((field) =>
      _.isFunction(field) ? field(input.z, input.bundle) : field
    )
  ).then((fields) => _.flatten(fields));
};

const executeCallbackMethod = (z, bundle, method) => {
  return new ZapierPromise((resolve, reject) => {
    const callback = (err, output) => {
      if (err) {
        reject(err);
      } else {
        resolve(output);
      }
    };

    method(z, bundle, callback);
  });
};

const isInputOutputFields = (methodName) =>
  methodName.match(/\.(inputFields|outputFields)$/);

const isRenderOnly = (methodName) =>
  _.indexOf(constants.RENDER_ONLY_METHODS, methodName) >= 0;

const execute = (app, input) => {
  const z = input.z;
  const methodName = input._zapier.event.method;
  const method = _.get(app, methodName);
  const bundle = input._zapier.event.bundle || {};

  if (isInputOutputFields(methodName)) {
    return executeInputOutputFields(method, input);
  } else if (_.isFunction(method)) {
    // TODO: would be nice to be a bit smarter about this
    // either by only setting props we know are used or by
    // moving this safing code into before middleware
    bundle.authData = bundle.authData || {};
    bundle.inputData = bundle.inputData || {};
    if (method.length >= 3) {
      return executeCallbackMethod(input.z, bundle, method);
    }
    return method(z, bundle);
  } else if (_.isObject(method) && method.url) {
    const options = method;
    if (isRenderOnly(methodName)) {
      const requestWithInput = _.extend(
        {},
        injectInput(input)(options),
        constants.REQUEST_OBJECT_SHORTHAND_OPTIONS
      );
      const preparedRequest = addQueryParams(prepareRequest(requestWithInput));
      return preparedRequest.url;
    }
    return executeHttpRequest(input, options);
  } else {
    throw new Error(
      `Error: Could not find the method to call: ${input._zapier.event.method}`
    );
  }
};

module.exports = execute;
