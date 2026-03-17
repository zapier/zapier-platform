'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const PLAIN_INPUT_FIELD_SCHEMA_ID = '/PlainInputFieldSchema';

const actionTypes = ['triggers', 'searches', 'creates', 'bulkReads'];
const resourceMethods = ['get', 'list', 'hook', 'search', 'create'];

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
  _.each(actionTypes, (actionType) => {
    if (definition[actionType]) {
      _.each(definition[actionType], (actionDef) => {
        if (actionDef.operation && actionDef.operation.inputFields) {
          _.each(actionDef.operation.inputFields, (field, index) => {
            const path = `instance.${actionType}.${actionDef.key}.operation.inputFields[${index}]`;
            errors = errors.concat(checkField(field, path));
          });
        }
      });
    }
  });

  // Handle resources if they exist
  if (definition.resources) {
    _.each(definition.resources, (resource, resourceKey) => {
      resourceMethods.forEach((method) => {
        if (
          resource[method] &&
          resource[method].operation &&
          resource[method].operation.inputFields
        ) {
          _.each(resource[method].operation.inputFields, (field, index) => {
            const path = `instance.resources.${resourceKey}.${method}.operation.inputFields[${index}]`;
            errors = errors.concat(checkField(field, path));
          });
        }
      });
    });
  }

  return errors;
};

module.exports = schemaRequiresJsonType;
