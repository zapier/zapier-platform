'use strict';

const _ = require('lodash');

const isTrigger = require('./is-trigger');

const getPreferredPrimaryKeys = (compiledApp, triggerKey) => {
  const defaultPrimaryKeys = ['id'];

  if (!triggerKey) {
    return defaultPrimaryKeys;
  }

  const outputFields = _.get(compiledApp, [
    'triggers',
    triggerKey,
    'operation',
    'outputFields',
  ]);

  if (!outputFields || !Array.isArray(outputFields)) {
    return defaultPrimaryKeys;
  }

  const primaryKeys = outputFields
    .filter((f) => f && f.primary && f.key)
    .map((f) => f.key);

  return primaryKeys.length > 0 ? primaryKeys : defaultPrimaryKeys;
};

const isPrimitive = (v) => {
  return (
    v === null ||
    v === undefined ||
    typeof v === 'string' ||
    typeof v === 'number' ||
    typeof v === 'boolean'
  );
};

// Gets array v where v[i] === result[primaryKeys[i]] and stringifies v into a string.
// Throws TypeError if any of the values are not primitive.
const stringifyValuesFromPrimaryKeys = (result, primaryKeys) => {
  const values = primaryKeys
    .map((k, i) => {
      let v = result[k];
      if (v === undefined) {
        // undefined is not a valid JSON value. Here we convert it to string so we will
        // have `{"id":"undefined"}` in the error message rather than `{}`,
        // which is confusing.
        v = 'undefined';
      }
      if (!isPrimitive(v)) {
        throw new TypeError(
          `As part of primary key, field "${k}" must be a primitive (non-object like number or string)`,
        );
      }
      return [k, v];
    })
    .reduce((acc, [k, v]) => {
      acc[k] = v;
      return acc;
    }, {});
  return JSON.stringify(values);
};

/*
  Makes sure the primary keys are unique among the results
*/
const triggerHasUniquePrimary = {
  name: 'triggerHasUniquePrimary',
  shouldRun: isTrigger,
  run: (method, results, compiledApp) => {
    const triggerKey = method.split('.', 2)[1];
    const primaryKeys = getPreferredPrimaryKeys(compiledApp, triggerKey);

    const usingDefaultPrimary =
      primaryKeys.length === 1 && primaryKeys[0] === 'id';

    const idCount = {};

    if (!Array.isArray(results)) {
      // One item can't have duplicates
      return [];
    }

    for (const result of results) {
      if (!result) {
        // this'll get caught elsewhere, but we don't want to blow up this check
        continue;
      }

      let uniqueKey;
      try {
        uniqueKey = stringifyValuesFromPrimaryKeys(result, primaryKeys);
      } catch (e) {
        return [e.message];
      }

      const count = (idCount[uniqueKey] = (idCount[uniqueKey] || 0) + 1);
      if (count > 1) {
        if (usingDefaultPrimary && uniqueKey === '{"id":"undefined"}') {
          // This is for backward compatibility. By default, `id` is used as
          // primary key. But if `results` have no `id` field, let it pass here
          // and the other check trigger-has-id will catch it.
          continue;
        }
        return [
          `Got two or more results with primary key of \`${uniqueKey}\`, primary key should be unique`,
        ];
      }
    }

    return [];
  },
};

module.exports = triggerHasUniquePrimary;
