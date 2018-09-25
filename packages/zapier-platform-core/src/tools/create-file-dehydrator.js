'use strict';

const _ = require('lodash');

const { DEFAULT_FILE_HYDRATOR_NAME } = require('../constants');
const { DehydrateError } = require('../errors');
const resolveMethodPath = require('./resolve-method-path');
const wrapHydrate = require('./wrap-hydrate');

const createFileDehydrator = input => {
  const app = _.get(input, '_zapier.app');

  const dehydrateFileFromRequest = (url, request, meta) => {
    url = url || undefined;
    request = request || undefined;
    meta = meta || undefined;
    if (!url && !request) {
      throw new DehydrateError(
        'You must provide either url or request arguments!'
      );
    }
    return wrapHydrate({
      type: 'file',
      method: `hydrators.${DEFAULT_FILE_HYDRATOR_NAME}`,
      bundle: { url, request, meta }
    });
  };

  const dehydrateFileFromFunc = (func, inputData) => {
    inputData = inputData || {};
    if (inputData.inputData) {
      throw new DehydrateError(
        'Oops! You passed a full `bundle` - really you should pass what you want under `inputData`!'
      );
    }
    return wrapHydrate({
      type: 'file',
      method: resolveMethodPath(app, func),
      // inputData vs. bundle is a legacy oddity
      bundle: _.omit(inputData, 'environment') // don't leak the environment
    });
  };

  return (...args) => {
    const arg0 = args[0];
    if (_.isFunction(arg0)) {
      return dehydrateFileFromFunc.apply(this, args);
    }
    if (arg0 && typeof arg0 !== 'string') {
      throw new DehydrateError(
        `First argument must be either null, a URL (string), or a hydrator function! We got ${typeof arg0}.`
      );
    }
    return dehydrateFileFromRequest.apply(this, args);
  };
};

module.exports = createFileDehydrator;
