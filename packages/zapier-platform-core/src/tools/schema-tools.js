'use strict';

const dataTools = require('./data');

// TODO: bryanhelmig, could support callback third argument but not naively
const makeFunction = source => {
  try {
    return Function('z', 'bundle', source); // eslint-disable-line no-new-func
  } catch (err) {
    return () => {
      throw err;
    };
  }
};

const requireOrLazyError = path => {
  try {
    const func = require(path);
    if (typeof func === 'function') {
      return func;
    }
    throw new Error(`${path} does not export a function!`);
  } catch (err) {
    return () => {
      throw err;
    };
  }
};

const findSourceRequireFunctions = appRaw => {
  const replacer = obj => {
    if (obj && typeof obj === 'object' && Object.keys(obj).length === 1) {
      if (
        typeof obj.source === 'string' &&
        obj.source.indexOf('return') !== -1
      ) {
        obj = makeFunction(obj.source);
      } else if (typeof obj.require === 'string' && obj.require) {
        obj = requireOrLazyError(obj.require);
      }
    }
    return obj;
  };
  appRaw = dataTools.recurseReplace(appRaw, replacer, { all: true });
  return appRaw;
};

module.exports = {
  makeFunction,
  requireOrLazyError,
  findSourceRequireFunctions
};
