'use strict';

const isInputOrOutputFields = (method) =>
  method.endsWith('.operation.inputFields') ||
  method.endsWith('.operation.outputFields');

const dynamicFieldsHaveKeys = {
  name: 'dynamicFieldsHaveKeys',
  shouldRun: isInputOrOutputFields,
  run: (method, results) => {
    const lastMethodPart = method.split('.').pop();

    if (!Array.isArray(results)) {
      const type = typeof results;
      return [`${lastMethodPart} must be an array, got ${type}`];
    }

    const errors = [];
    for (let i = 0; i < results.length; i++) {
      const field = results[i];
      if (!field || !field.key) {
        errors.push(`${lastMethodPart}[${i}] is missing a key`);
      }
    }

    return errors;
  },
};

module.exports = dynamicFieldsHaveKeys;
