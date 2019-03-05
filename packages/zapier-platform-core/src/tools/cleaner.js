'use strict';

const _ = require('lodash');
const { defaults, pick, pipe } = require('lodash/fp');

const {
  flattenPaths,
  getObjectType,
  isPlainObj,
  recurseReplace
} = require('./data');

const DEFAULT_BUNDLE = {
  authData: {},
  inputData: {},
  targetUrl: '',
  subscribeData: {}
};

const recurseCleanFuncs = (obj, path) => {
  // mainly turn functions into $func${arity}${arguments}$
  path = path || [];
  if (typeof obj == 'function') {
    const usesArguments =
      obj.toString().indexOf('arguments') !== -1 ? 't' : 'f';
    // TODO: could optimize $func$0$f$ as "pure" and just render them
    return `$func$${obj.length}$${usesArguments}$`;
  } else if (Array.isArray(obj)) {
    return obj.map((value, i) => {
      return recurseCleanFuncs(value, path.concat([i]));
    });
  } else if (isPlainObj(obj)) {
    const newObj = {};
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      newObj[key] = recurseCleanFuncs(value, path.concat([key]));
    });
    return newObj;
  }
  return obj;
};

// Recurse a nested object replace all instances of keys->vals in the bank.
const recurseReplaceBank = (obj, bank = {}) => {
  const replacer = out => {
    if (typeof out !== 'string') {
      return out;
    }

    Object.keys(bank).forEach(key => {
      // Escape characters (ex. {{foo}} => \\{\\{foo\\}\\} )
      const escapedKey = key.replace(/[-[\]/{}()\\*+?.^$|]/g, '\\$&');
      const matchesKey = new RegExp(escapedKey, 'g');

      if (!matchesKey.test(out)) {
        return;
      }

      const matchesCurlies = /({{.*?}})/;
      const valueParts = out.split(matchesCurlies).filter(Boolean);
      const replacementValue = bank[key];
      const isPartOfString = !matchesCurlies.test(out) || valueParts.length > 1;
      const shouldThrowTypeError =
        isPartOfString &&
        (Array.isArray(replacementValue) || _.isPlainObject(replacementValue));

      if (shouldThrowTypeError) {
        throw new TypeError(
          `Cannot reliably interpolate objects or arrays into a string. We received an ${getObjectType(
            replacementValue
          )}:\n"${replacementValue}"`
        );
      }

      out = isPartOfString
        ? valueParts.join('').replace(matchesKey, replacementValue)
        : replacementValue;
    });

    return out;
  };
  return recurseReplace(obj, replacer);
};

const finalizeBundle = pipe(
  pick(Object.keys(DEFAULT_BUNDLE)),
  defaults(DEFAULT_BUNDLE)
);

// Takes a raw app and bundle and composes a bank of {{key}}->val
const createBundleBank = (appRaw, event = {}) => {
  const bank = {
    bundle: finalizeBundle(event.bundle),
    process: {
      env: _.extend({}, process.env || {})
    }
  };

  const options = { preserve: { 'bundle.inputData': true } };
  const flattenedBank = flattenPaths(bank, options);
  return Object.keys(flattenedBank).reduce((coll, key) => {
    coll[`{{${key}}}`] = flattenedBank[key];
    return coll;
  }, {});
};

const maskOutput = output => _.pick(output, 'results', 'status');

module.exports = {
  recurseCleanFuncs,
  recurseReplaceBank,
  createBundleBank,
  maskOutput
};
