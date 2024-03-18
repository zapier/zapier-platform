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
  const values = primaryKeys.map((key) => result[key]);
  return values
    .map((v, i) => {
      const fieldKey = primaryKeys[i];
      if (!isPrimitive(v)) {
        throw new TypeError(
          `As a primary key, field "${fieldKey}" must be a primitive (non-object like number or string)`
        );
      }
      if (v == null) {
        return '';
      }
      return `${fieldKey}=${v.toString()}`;
    })
    .join('&');
};

/*
  Makes sure the results all have a unique primary key in them.
*/
const triggerHasUniquePrimary = {
  name: 'triggerHasUniquePrimary',
  shouldRun: isTrigger,
  run: (method, results, compiledApp) => {
    const triggerKey = method.split('.', 2)[1];
    const primaryKeys = getPreferredPrimaryKeys(compiledApp, triggerKey);

    const idCount = {};

    for (const result of results) {
      if (result == null) {
        // this'll get caught elsewhere, but we don't want to blow up this check
        continue;
      }

      let id;
      try {
        id = stringifyValuesFromPrimaryKeys(result, primaryKeys);
      } catch (e) {
        return [e.message];
      }

      const count = (idCount[id] = (idCount[id] || 0) + 1);
      if (count > 1) {
        return [
          `Got a two or more results with primary key of "${id}", primary key is supposed to be unique`,
        ];
      }
    }

    return [];
  },
};

module.exports = triggerHasUniquePrimary;
