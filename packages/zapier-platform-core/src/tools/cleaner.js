'use strict';

const _ = require('lodash');
const { defaults, pick, pipe } = require('lodash/fp');

const isPlainObj = require('./data').isPlainObj;
const recurseReplace = require('./data').recurseReplace;
const flattenPaths = require('./data').flattenPaths;

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
      const s = String(key).replace(/[-[\]/{}()\\*+?.^$|]/g, '\\$&');
      const re = new RegExp(s, 'g');
      out = out.replace(re, bank[key]);
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

  const flattenedBank = flattenPaths(bank);
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
