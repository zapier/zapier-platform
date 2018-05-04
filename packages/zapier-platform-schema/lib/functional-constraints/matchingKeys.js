'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const actionTypes = ['triggers', 'searches', 'creates'];

const matchingKeys = definition => {
  const errors = [];

  // verifies that x.key === x
  // otherwise, we double results in the compiled app via core's compileApp

  for (const actionType of actionTypes) {
    const group = definition[actionType] || {};
    _.each(group, (action, key) => {
      if (action.key !== key) {
        errors.push(
          new jsonschema.ValidationError(
            `must have a matching top-level key (found "${key}" and "${
              action.key
            }")`,
            action,
            `/${_.capitalize(actionType)}Schema`,
            `instance.${key}.key`,
            'invalid',
            'key'
          )
        );
      }
    });
  }

  return errors;
};

module.exports = matchingKeys;
