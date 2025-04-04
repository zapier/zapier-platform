'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const actionTypes = ['triggers', 'searches', 'creates'];

const uniqueInputFieldKeys = (definition) => {
  const errors = [];
  for (const actionType of actionTypes) {
    const group = definition[actionType] || {};
    _.each(group, (action, key) => {
      const inputFields = _.get(action, ['operation', 'inputFields'], []);

      const existingKeys = {}; // map of key to where it already lives

      inputFields.forEach((inputField, index) => {
        // could be a string or a non-field object (`source` or `require` function obj)
        if (!inputField.key) {
          return;
        }

        if (existingKeys[inputField.key]) {
          errors.push(
            new jsonschema.ValidationError(
              `inputField keys must be unique for each action. The key "${
                inputField.key
              }" is already in use at ${actionType}.${key}.operation.${
                existingKeys[inputField.key]
              }.key`,
              inputField.key,
              `/BasicOperationSchema`,
              `instance.${actionType}.${key}.operation.inputFields[${index}].key`,
            ),
          );
        } else {
          existingKeys[inputField.key] = `inputFields[${index}]`;
        }

        (inputField.children || []).forEach((subField, subFieldIndex) => {
          if (existingKeys[subField.key]) {
            errors.push(
              new jsonschema.ValidationError(
                `inputField keys must be unique for each action, even if they're children. The key "${
                  subField.key
                }" is already in use at ${actionType}.${key}.operation.${
                  existingKeys[subField.key]
                }.key`,
                subField.key,
                `/BasicOperationSchema`,
                `instance.${actionType}.${key}.operation.inputFields[${index}].children[${subFieldIndex}].key`,
              ),
            );
          } else {
            existingKeys[subField.key] =
              `inputFields[${index}].children[${subFieldIndex}]`;
          }
        });
      });
    });
  }

  return errors;
};

module.exports = uniqueInputFieldKeys;
