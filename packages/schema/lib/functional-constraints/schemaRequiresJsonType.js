'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const PLAIN_INPUT_FIELD_SCHEMA_ID = '/PlainInputFieldSchema';

const checkField = (field, path) => {
  if (_.has(field, 'schema') && field.type !== 'json') {
    return [
      new jsonschema.ValidationError(
        'must have `type` set to `json` when `schema` is provided.',
        field,
        '/PlainInputFieldSchema',
        path,
        'invalidSchema',
        'schema',
      ),
    ];
  }
  return [];
};

const schemaRequiresJsonType = (definition, mainSchema) => {
  let errors = [];

  // Handle individual field validation (for auto-tests of examples/antiExamples)
  if (mainSchema.id === PLAIN_INPUT_FIELD_SCHEMA_ID) {
    errors = errors.concat(checkField(definition, 'instance'));
  }

  // Handle full app definition validation
  _.each(['triggers', 'searches', 'creates'], (typeOf) => {
    if (definition[typeOf]) {
      _.each(definition[typeOf], (actionDef) => {
        if (actionDef.operation && actionDef.operation.inputFields) {
          _.each(actionDef.operation.inputFields, (field, index) => {
            const path = `instance.${typeOf}.${actionDef.key}.inputFields[${index}]`;
            errors = errors.concat(checkField(field, path));
          });
        }
      });
    }
  });

  return errors;
};

module.exports = schemaRequiresJsonType;
