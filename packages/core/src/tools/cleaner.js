'use strict';

const _ = require('lodash');
const { defaults, pick, pipe } = require('lodash/fp');

const {
  flattenPaths,
  getObjectType,
  isPlainObj,
  recurseReplace,
} = require('./data');

const DEFAULT_BUNDLE = {
  authData: {},
  inputData: {},
  meta: {},
  subscribeData: {},
  targetUrl: '',
};

const isCurlies = /{{.*?}}/g;

const recurseCleanFuncs = (obj, path) => {
  // mainly turn functions into $func${arity}${arguments}$
  path = path || [];
  if (typeof obj === 'function') {
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
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      newObj[key] = recurseCleanFuncs(value, path.concat([key]));
    });
    return newObj;
  }
  return obj;
};

const findNextCurlies = (str) => {
  const start = str.indexOf('{{');
  if (start < 0) {
    return {
      start: -1,
      end: -1,
    };
  }

  const end = str.indexOf('}}', start + 2);
  if (end < 0) {
    return {
      start: -1,
      end: -1,
    };
  }

  return {
    start,
    end: end + 2,
  };
};

// Recurse a nested object replace all instances of keys->vals in the bank.
const recurseReplaceBank = (obj, bank = {}) => {
  const replacer = (input) => {
    if (!['string', 'number'].includes(typeof input)) {
      return input;
    }

    const outputStrings = [];
    let inputString = String(input);

    // 1000 iterations is just a static upper bound to make infinite loops
    // impossible. Who would have 1000 {{curlies}} in a string... right?
    for (let i = 0; i < 1000; i++) {
      const { start, end } = findNextCurlies(inputString);
      if (start < 0) {
        break;
      }

      const head = inputString.slice(0, start);
      const key = inputString.slice(start, end);
      const tail = inputString.slice(end);

      outputStrings.push(head);

      const replacementValue = bank[key];
      if (replacementValue) {
        if (
          Array.isArray(replacementValue) ||
          _.isPlainObject(replacementValue)
        ) {
          throw new TypeError(
            'Cannot reliably interpolate objects or arrays into a string. ' +
              `Variable \`${key}\` is an ${getObjectType(
                replacementValue,
              )}:\n"${replacementValue}"`,
          );
        } else {
          outputStrings.push(replacementValue);
        }
      } else {
        outputStrings.push('');
      }

      inputString = tail;
    }

    return outputStrings.join('');
  };
  return recurseReplace(obj, replacer);
};

const finalizeBundle = pipe(
  pick(Object.keys(DEFAULT_BUNDLE)),
  defaults(DEFAULT_BUNDLE),
);

// Takes a raw app and bundle and composes a bank of {{key}}->val
const createBundleBank = (appRaw, event = {}, serializeFunc = (x) => x) => {
  const bank = {
    bundle: finalizeBundle(event.bundle),
    process: {
      env: _.extend({}, process.env || {}),
    },
  };

  const options = { preserve: { 'bundle.inputData': true } };
  const flattenedBank = flattenPaths(bank, options);

  return Object.entries(flattenedBank).reduce((coll, [key, value]) => {
    coll[`{{${key}}}`] = serializeFunc(value);
    return coll;
  }, {});
};

const maskOutput = (output) =>
  _.pick(output, 'results', 'status', 'resultsUrl');

// These normalize functions are called after the initial before middleware that
// cleans the request. The reason is that we need to know why a value is empty
// later on. If we resolve all templates (even with undefined values) first, we
// don't know _why_ it was an empty string. Was it from a user supplied value in
// an earlier Zap step? Or was it a null value? Each has different results depending
// on how the partner has configued their integration.
const normalizeEmptyRequestFields = (shouldCleanup, field, req) => {
  const handleEmpty = (key) => {
    const value = req[field][key] || '';
    const cleaned = value.replace(isCurlies, '');

    if (value !== cleaned) {
      req[field][key] = cleaned;
    }

    if (!cleaned && req.removeMissingValuesFrom[field]) {
      delete req[field][key];
    }
  };

  Object.entries(req[field]).forEach(([key, value]) => {
    if (shouldCleanup(value)) {
      handleEmpty(key);
    }
  });
};

const isEmptyQueryParam = (value) =>
  value === '' ||
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.search(isCurlies) >= 0);

const normalizeEmptyParamFields = normalizeEmptyRequestFields.bind(
  null,
  isEmptyQueryParam,
  'params',
);
const normalizeEmptyBodyFields = normalizeEmptyRequestFields.bind(
  null,
  (v) => typeof v === 'string' && v.search(isCurlies) >= 0,
  'body',
);

module.exports = {
  createBundleBank,
  maskOutput,
  normalizeEmptyBodyFields,
  normalizeEmptyParamFields,
  recurseCleanFuncs,
  recurseReplaceBank,
};
