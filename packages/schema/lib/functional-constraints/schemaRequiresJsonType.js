'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const PLAIN_INPUT_FIELD_SCHEMA_ID = '/PlainInputFieldSchema';

const actionTypes = ['triggers', 'searches', 'creates', 'bulkReads'];
const resourceMethods = ['get', 'list', 'hook', 'search', 'create'];

const VALID_JSON_SCHEMA_TYPES = [
  'object',
  'array',
  'string',
  'number',
  'integer',
  'boolean',
  'null',
];

// JSON Schema meta-schema (Draft 4 subset) used to validate user-provided
// schemas via jsonschema.Validator instead of hand-rolled recursive checks.
const JSON_SCHEMA_META_SCHEMA = {
  id: '/JsonSchemaMetaSchema',
  type: 'object',
  properties: {
    type: {
      anyOf: [
        { type: 'string', enum: VALID_JSON_SCHEMA_TYPES },
        {
          type: 'array',
          items: { type: 'string', enum: VALID_JSON_SCHEMA_TYPES },
          minItems: 1,
          uniqueItems: true,
        },
      ],
    },
    properties: {
      type: 'object',
      additionalProperties: { $ref: '/JsonSchemaMetaSchema' },
    },
    items: {
      anyOf: [
        { $ref: '/JsonSchemaMetaSchema' },
        {
          type: 'array',
          items: { $ref: '/JsonSchemaMetaSchema' },
          minItems: 1,
        },
      ],
    },
    required: {
      type: 'array',
      items: { type: 'string' },
    },
    additionalProperties: {
      anyOf: [{ type: 'boolean' }, { $ref: '/JsonSchemaMetaSchema' }],
    },
    allOf: {
      type: 'array',
      items: { $ref: '/JsonSchemaMetaSchema' },
      minItems: 1,
    },
    anyOf: {
      type: 'array',
      items: { $ref: '/JsonSchemaMetaSchema' },
      minItems: 1,
    },
    oneOf: {
      type: 'array',
      items: { $ref: '/JsonSchemaMetaSchema' },
      minItems: 1,
    },
    not: { $ref: '/JsonSchemaMetaSchema' },
    enum: { type: 'array', minItems: 1 },
  },
  additionalProperties: true,
};

// Reusable validator instance with the meta-schema pre-loaded.
const metaValidator = new jsonschema.Validator();
metaValidator.addSchema(JSON_SCHEMA_META_SCHEMA, JSON_SCHEMA_META_SCHEMA.id);

/**
 * Translates a jsonschema ValidationError from meta-schema validation
 * into human-readable error message(s).
 * @returns {string[]}
 */
const formatMetaSchemaError = (error, rootPath) => {
  const relativePath = error.property.replace(/^instance\.?/, '');
  const fullPath = relativePath ? `${rootPath}.${relativePath}` : rootPath;

  // "type" field: invalid JSON Schema type value
  if (/\.type$/.test(error.property) || error.property === 'instance.type') {
    if (error.name === 'anyOf') {
      const value = error.instance;
      if (typeof value === 'string') {
        return [
          `${fullPath}: invalid type "${value}". Must be one of: ${VALID_JSON_SCHEMA_TYPES.join(', ')}`,
        ];
      }
      if (Array.isArray(value)) {
        const messages = [];
        value.forEach((t, i) => {
          if (typeof t !== 'string' || !VALID_JSON_SCHEMA_TYPES.includes(t)) {
            messages.push(
              `${fullPath}[${i}]: invalid type "${t}". Must be one of: ${VALID_JSON_SCHEMA_TYPES.join(', ')}`,
            );
          }
        });
        return messages.length > 0
          ? messages
          : [`${fullPath}: must be a string or array of strings`];
      }
      return [`${fullPath}: must be a string or array of strings`];
    }
  }

  // Non-object where a JSON Schema object is expected
  if (error.name === 'type' && _.isEqual(error.argument, ['object'])) {
    return [`${fullPath}: must be a valid JSON Schema object`];
  }

  // Non-array where an array is expected (required, enum, allOf, etc.)
  if (error.name === 'type' && _.isEqual(error.argument, ['array'])) {
    return [`${fullPath}: must be an array`];
  }

  // anyOf failure for fields expecting a schema (items, additionalProperties)
  if (error.name === 'anyOf') {
    const value = error.instance;
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return [`${fullPath}: must be a valid JSON Schema object`];
    }
    return [`${fullPath}: must be a valid JSON Schema`];
  }

  // Default fallback
  return [`${fullPath}: ${error.message}`];
};

/**
 * Validates that an object is a structurally valid JSON Schema using the
 * jsonschema library against a meta-schema.
 * Returns an array of error message strings.
 */
const collectSchemaErrors = (schema, rootPath) => {
  if (typeof schema !== 'object' || schema === null || Array.isArray(schema)) {
    return [`${rootPath}: must be a valid JSON Schema object`];
  }

  const result = metaValidator.validate(schema, JSON_SCHEMA_META_SCHEMA);
  const errors = [];
  result.errors.forEach((error) => {
    errors.push(...formatMetaSchemaError(error, rootPath));
  });
  return errors;
};

const checkField = (field, path) => {
  const errors = [];

  if (_.has(field, 'schema') && field.type !== 'json') {
    errors.push(
      new jsonschema.ValidationError(
        'must have `type` set to `json` when `schema` is provided.',
        field,
        '/PlainInputFieldSchema',
        path,
        'invalidSchema',
        'schema',
      ),
    );
  }

  if (_.has(field, 'schema') && field.type === 'json') {
    const schemaErrors = collectSchemaErrors(field.schema, 'schema');
    schemaErrors.forEach((message) => {
      errors.push(
        new jsonschema.ValidationError(
          `has an invalid JSON Schema in \`schema\`: ${message}`,
          field,
          '/PlainInputFieldSchema',
          path,
          'invalidJsonSchema',
          'schema',
        ),
      );
    });
  }

  return errors;
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
