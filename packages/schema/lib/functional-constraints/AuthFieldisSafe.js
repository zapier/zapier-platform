'use strict';

const jsonschema = require('jsonschema');

const AUTH_FIELD_ID = '/AuthFieldSchema';
const AUTH_FIELDS_ID = '/AuthFieldsSchema';

const FORBIDDEN_KEYS = [
  'access_token',
  'refresh_token',
  'api_key',
  'password',
  'secret',
];

const checkAuthField = (field) => {
  const errors = [];

  if (FORBIDDEN_KEYS.includes(field.key) && field.isSafe === true) {
    errors.push(
      new jsonschema.ValidationError(
        `Cannot set isSafe=true for the sensitive key "${field.key}".`,
        field,
        '/AuthFieldSchema',
        'instance.key',
        'sensitive',
        'key',
      ),
    );
  }

  return errors;
};

module.exports = (definition, mainSchema) => {
  const errors = [];
  // Done to validate anti-examples declaratively defined in the schema
  if ([AUTH_FIELD_ID, AUTH_FIELDS_ID].includes(mainSchema.id)) {
    const definitions = Array.isArray(definition) ? definition : [definition];

    definitions.forEach((field, index) => {
      checkAuthField(field).forEach((err) => {
        err.property = `instance[${index}]`;
        err.stack = err.stack.replace('instance.key', `instance[${index}].key`);
        errors.push(err);
      });
    });
  }

  // If there's no authentication or no fields, we have nothing to check
  if (!definition.authentication || !definition.authentication.fields) {
    return errors;
  }

  definition.authentication.fields.forEach((field, index) => {
    checkAuthField(field).forEach((err) => {
      err.property = `instance.authentication.fields[${index}]`;
      err.stack = err.stack.replace('instance.field', err.property);
      errors.push(err);
    });
  });

  return errors;
};
