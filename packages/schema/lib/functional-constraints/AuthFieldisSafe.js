'use strict';

const jsonschema = require('jsonschema');

const AUTH_FIELD_ID = '/AuthFieldSchema';
const AUTH_FIELDS_ID = '/AuthFieldsSchema';

const FORBIDDEN_KEYS = [
  'access_token',
  'api_key',
  'apikey',
  'api-key',
  'auth',
  'jwt',
  'passwd',
  'password',
  'pswd',
  'refresh_token',
  'secret',
  'set-cookie',
  'signature',
  'token',
];

const isSensitiveKey = (key = '') =>
  FORBIDDEN_KEYS.some((forbidden) =>
    key.toLowerCase().includes(forbidden.toLowerCase()),
  );

const checkAuthField = (field) => {
  const errors = [];

  // if the field key contains any forbidden substring (case-insensitive),
  // AND 'isSecret' is true, throw a validation error
  if (isSensitiveKey(field.key) && field.isNotSecret === true) {
    errors.push(
      new jsonschema.ValidationError(
        `cannot set isNotSecret as true for the sensitive key "${field.key}".`,
        field,
        '/AuthFieldSchema',
        'instance.field',
        'sensitive',
        'field',
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
        err.stack = err.stack.replace('instance.field', err.property);
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
