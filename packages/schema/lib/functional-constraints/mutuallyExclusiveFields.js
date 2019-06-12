'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

// NOTE: While it would be possible to accomplish this with a solution like
//   https://stackoverflow.com/questions/28162509/mutually-exclusive-property-groups#28172831
//   it was harder to read and understand.

const { INCOMPATIBLE_FIELD_SCHEMA_KEYS } = require('../constants');

const verifyIncompatibilities = (inputFields, path) => {
  const errors = [];

  _.each(inputFields, (inputField, index) => {
    _.each(INCOMPATIBLE_FIELD_SCHEMA_KEYS, ([firstField, secondField]) => {
      if (_.has(inputField, firstField) && _.has(inputField, secondField)) {
        errors.push(
          new jsonschema.ValidationError(
            `must not contain ${firstField} and ${secondField}, as they're mutually exclusive.`,
            inputField,
            '/FieldSchema',
            `instance.${path}.inputFields[${index}]`,
            'invalid',
            'inputFields'
          )
        );
      }
    });
  });

  return errors;
};

const mutuallyExclusiveFields = definition => {
  let errors = [];

  _.each(['triggers', 'searches', 'creates'], typeOf => {
    if (definition[typeOf]) {
      _.each(definition[typeOf], actionDef => {
        if (actionDef.operation && actionDef.operation.inputFields) {
          errors = [
            ...errors,
            ...verifyIncompatibilities(
              actionDef.operation.inputFields,
              `${typeOf}.${actionDef.key}`
            )
          ];
        }
      });
    }
  });

  return errors;
};

module.exports = mutuallyExclusiveFields;
