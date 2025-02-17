'use strict';

const jsonschema = require('jsonschema');

const AUTH_FIELD_ID = '/AuthFieldSchema';
const AUTH_FIELDS_ID = '/AuthFieldsSchema';

const FORBIDDEN_KEYS = [
  'access_token',
  'access-token',
  'accesstoken',
  'api_key',
  'apikey',
  'api-key',
  'auth',
  'jwt',
  'passwd',
  'password',
  'pswd',
  'refresh_token',
  'refresh-token',
  'refreshtoken',
  'secret',
  'set-cookie',
  'set_cookie',
  'setcookie',
  'signature',
  'token',
];

const isSensitiveKey = (key = '') =>
  FORBIDDEN_KEYS.some((forbidden) => key.toLowerCase().includes(forbidden));

const checkAuthField = (field) => {
  const errors = [];

  // if the field key contains any forbidden substring (case-insensitive),
  // AND 'isNoSecret' is true, throw a validation error
  if (
    (field.key === 'password' || isSensitiveKey(field.key)) &&
    field.isNoSecret === true
  ) {
    errors.push(
      new jsonschema.ValidationError(
        `cannot set isNoSecret as true for the sensitive key "${field.key}".`,
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

  // If there's no authentication, we have nothing to check
  if (!definition.authentication) {
    return errors;
  }

  if (definition.authentication.inputFields) {
    definition.authentication.inputFields.forEach((field, index) => {
      checkAuthField(field).forEach((err) => {
        err.property = `instance.authentication.inputFields[${index}]`;
        err.stack = err.stack.replace('instance.field', err.property);
        errors.push(err);
      });
    });
  }
  if (definition.authentication.outputFields) {
    definition.authentication.outputFields.forEach((field, index) => {
      checkAuthField(field).forEach((err) => {
        err.property = `instance.authentication.outputFields[${index}]`;
        err.stack = err.stack.replace('instance.field', err.property);
        errors.push(err);
      });
    });
  }
  return errors;
};
