/* eslint-disable  valid-typeof */
'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const actionTypes = ['triggers', 'searches', 'creates'];
const inputFieldTypeMap = {
  string: 'string',
  text: 'string',
  integer: 'number',
  number: 'number',
  boolean: 'boolean',
  datetime: 'string',
  file: 'string',
  password: 'string',
  copy: 'string',
  code: 'string',
};

const alignedInputFieldDefaultType = (definition) => {
  const errors = [];
  for (const actionType of actionTypes) {
    const group = definition[actionType] || {};
    _.each(group, (action, key) => {
      const inputFields = _.get(action, ['operation', 'inputFields'], []);

      inputFields.forEach((inputField, index) => {
        if (
          inputField.default &&
          typeof inputField.default !== inputFieldTypeMap[inputField.type]
        ) {
          errors.push(
            new jsonschema.ValidationError(
              `default value ${inputField.default} must be of the same type "${inputField.type}" set for the inputField "${inputField.key}"`,
              inputField.key,
              `/BasicOperationSchema`,
              `instance.${actionType}.${key}.operation.inputFields[${index}].key`,
            ),
          );
        }
      });
    });
  }

  return errors;
};

module.exports = alignedInputFieldDefaultType;
