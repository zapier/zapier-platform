'use strict';

const dataTools = require('./data');

const makeFunction = (source, args) => {
  args = args || [];
  try {
    return Function.apply(null, args.concat([source]));
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
    if (obj && typeof obj === 'object') {
      const numKeys = Object.keys(obj).length;
      if (numKeys === 1 || numKeys === 2) {
        if (
          typeof obj.source === 'string' &&
          obj.source.indexOf('return') !== -1
        ) {
          const args = obj.args || ['z', 'bundle'];
          obj = makeFunction(obj.source, args);
        } else if (typeof obj.require === 'string' && obj.require) {
          obj = requireOrLazyError(obj.require);
        }
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
