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

// Recurse a nested object replace all instances of keys->vals in the bank.
const recurseReplaceBank = (obj, bank = {}) => {
  const replacer = (out) => {
    if (!['string', 'number'].includes(typeof out)) {
      return out;
    }

    // whatever leaves this function replaces values in the calling object
    // so, we don't want to return a different data type unless it's a censored string
    const originalValue = out;
    const originalValueStr = String(out);
    let maybeChangedString = originalValueStr;

    Object.keys(bank).forEach((key) => {
      // Escape characters (ex. {{foo}} => \\{\\{foo\\}\\} )
      const escapedKey = key.replace(/[-[\]/{}()\\*+?.^$|]/g, '\\$&');
      const matchesKey = new RegExp(escapedKey, 'g');

      if (!matchesKey.test(maybeChangedString)) {
        return;
      }

      const matchesCurlies = /({{.*?}})/;
      const valueParts = maybeChangedString
        .split(matchesCurlies)
        .filter(Boolean);
      const replacementValue = bank[key];
      const isPartOfString =
        !matchesCurlies.test(maybeChangedString) || valueParts.length > 1;
      const shouldThrowTypeError =
        isPartOfString &&
        (Array.isArray(replacementValue) || _.isPlainObject(replacementValue));

      if (shouldThrowTypeError) {
        const bareKey = _.trimEnd(_.trimStart(key, '{'), '}');
        throw new TypeError(
          'Cannot reliably interpolate objects or arrays into a string. ' +
            `Variable \`${bareKey}\` is an ${getObjectType(
              replacementValue
            )}:\n"${replacementValue}"`
        );
      }

      maybeChangedString = isPartOfString
        ? valueParts.join('').replace(matchesKey, replacementValue)
        : replacementValue;
    });

    if (originalValueStr === maybeChangedString) {
      // we didn't censor or replace the value, so return the original
      return originalValue;
    }
    return maybeChangedString;
  };
  return recurseReplace(obj, replacer);
};

const finalizeBundle = pipe(
  pick(Object.keys(DEFAULT_BUNDLE)),
  defaults(DEFAULT_BUNDLE)
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

const maskOutput = (output) => _.pick(output, 'results', 'status');

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
  isCurlies.test(value);

const normalizeEmptyParamFields = normalizeEmptyRequestFields.bind(
  null,
  isEmptyQueryParam,
  'params'
);
const normalizeEmptyBodyFields = normalizeEmptyRequestFields.bind(
  null,
  (v) => isCurlies.test(v),
  'body'
);

module.exports = {
  createBundleBank,
  maskOutput,
  normalizeEmptyBodyFields,
  normalizeEmptyParamFields,
  recurseCleanFuncs,
  recurseReplaceBank,
};
