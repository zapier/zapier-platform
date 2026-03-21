'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const PLAIN_INPUT_FIELD_SCHEMA_ID = '/PlainInputFieldSchema';

const actionTypes = ['triggers', 'searches', 'creates', 'bulkReads'];
const resourceMethods = ['get', 'list', 'hook', 'search', 'create'];

// Load official JSON Schema Draft 4 meta-schema
const draft4MetaSchema = require('json-metaschema/draft-04-schema.json');

const metaValidator = new jsonschema.Validator();

const VALID_JSON_SCHEMA_TYPES = [
  'object',
  'array',
  'string',
  'number',
  'integer',
  'boolean',
  'null',
];

// Translates jsonschema ValidationError from meta-schema validation
// into a human-readable error message.
const formatMetaSchemaError = (error, rootPath) => {
  const relativePath = error.property.replace(/^instance\.?/, '');
  const fullPath = relativePath ? `${rootPath}.${relativePath}` : rootPath;

  // "type" field: invalid JSON Schema type value
  if (/\.type$/.test(error.property) || error.property === 'instance.type') {
    if (error.name === 'anyOf') {
      const value = error.instance;
      if (typeof value === 'string') {
        return `${fullPath}: invalid type "${value}". Must be one of: ${VALID_JSON_SCHEMA_TYPES.join(', ')}`;
      }
      if (Array.isArray(value)) {
        const invalid = value.filter(
          (t) => typeof t !== 'string' || !VALID_JSON_SCHEMA_TYPES.includes(t),
        );
        if (invalid.length > 0) {
          return invalid
            .map(
              (t) =>
                `${fullPath}: invalid type "${t}". Must be one of: ${VALID_JSON_SCHEMA_TYPES.join(', ')}`,
            )
            .join('; ');
        }
        return `${fullPath}: must be a string or array of strings`;
      }
      return `${fullPath}: must be a string or array of strings`;
    }
  }

  // Non-object where a JSON Schema object is expected
  if (error.name === 'type' && _.isEqual(error.argument, ['object'])) {
    return `${fullPath}: must be a valid JSON Schema object`;
  }

  // Non-array where an array is expected (required, enum, allOf, etc.)
  if (error.name === 'type' && _.isEqual(error.argument, ['array'])) {
    const fieldName = fullPath.split('.').pop();
    return `${fieldName}: must be an array`;
  }

  // anyOf failure for fields expecting a schema or specific structure
  if (error.name === 'anyOf') {
    const value = error.instance;
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return `${fullPath}: must be a valid JSON Schema object`;
    }
    return `${fullPath}: must be a valid JSON Schema`;
  }

  // Default fallback
  return `${fullPath}: ${error.message}`;
};

// Validates that an object is a structurally valid JSON schema
// using the Draft 4 meta-schema via jsonschema library.
// Returns an array of error message strings
const collectSchemaErrors = (schema, rootPath) => {
  if (typeof schema !== 'object' || schema === null || Array.isArray(schema)) {
    return [`${rootPath}: must be a valid JSON Schema object`];
  }

  const result = metaValidator.validate(schema, draft4MetaSchema);
  return result.errors.map((error) => formatMetaSchemaError(error, rootPath));
};

const checkSchemaField = (field, path) => {
  let errors = [];

  if (_.has(field, 'schema')) {
    if (field.type !== 'json') {
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
    } else {
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
  }

  // Recurse into children (nested PlainInputFieldSchema)
  (field.children || []).forEach((child, childIndex) => {
    errors = errors.concat(
      checkSchemaField(child, `${path}.children[${childIndex}]`),
    );
  });

  return errors;
};

const schemaRequiresJsonType = (definition, mainSchema) => {
  let errors = [];

  // Handle individual field validation (for auto-tests of examples/antiExamples)
  if (mainSchema.id === PLAIN_INPUT_FIELD_SCHEMA_ID) {
    errors = errors.concat(checkSchemaField(definition, 'instance'));
  }

  // Handle full app definition validation
  _.each(actionTypes, (actionType) => {
    if (definition[actionType]) {
      _.each(definition[actionType], (actionDef) => {
        if (actionDef.operation && actionDef.operation.inputFields) {
          _.each(actionDef.operation.inputFields, (field, index) => {
            const path = `instance.${actionType}.${actionDef.key}.operation.inputFields[${index}]`;
            errors = errors.concat(checkSchemaField(field, path));
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
            errors = errors.concat(checkSchemaField(field, path));
          });
        }
      });
    });
  }

  return errors;
};

module.exports = schemaRequiresJsonType;
