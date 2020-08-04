'use strict';

const findDuplicateFieldKeys = require('../tools/find-duplicate-field-keys');
const isInputFields = require('./is-input-fields');

/*
  Makes sure inputFields request does not return fields with duplicate keys.
*/
const inputFieldsHaveUniqueKeys = {
  name: 'inputFieldsHaveUniqueKeys',
  shouldRun: isInputFields,
  run: (method, results) => {
    const duplicateKeys = findDuplicateFieldKeys(results);
    if (duplicateKeys.length > 0) {
      return [`Duplicate field keys: ${duplicateKeys.join(', ')}`];
    }

    return [];
  },
};

module.exports = inputFieldsHaveUniqueKeys;
