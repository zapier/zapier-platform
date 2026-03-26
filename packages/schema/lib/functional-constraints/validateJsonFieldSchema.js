'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const PLAIN_INPUT_FIELD_SCHEMA_ID = '/PlainInputFieldSchema';

const actionTypes = ['triggers', 'searches', 'creates', 'bulkReads'];
const resourceMethods = ['get', 'list', 'hook', 'search', 'create'];

// Load supported JSON Schema meta-schemas
const draft4MetaSchema = require('json-metaschema/draft-04-schema.json');
const draft6MetaSchema = require('json-metaschema/draft-06-schema.json');
const draft7MetaSchema = require('json-metaschema/draft-07-schema.json');

// Map of supported $schema URIs (without trailing #) to their meta-schemas
// HTTPS supported but normalized below
const SUPPORTED_META_SCHEMAS = {
  'http://json-schema.org/draft-04/schema': draft4MetaSchema,
  'http://json-schema.org/draft-06/schema': draft6MetaSchema,
  'http://json-schema.org/draft-07/schema': draft7MetaSchema,
};

const metaValidator = new jsonschema.Validator();

// Translates jsonschema ValidationError from meta-schema validation
// into a human-readable error message.
const formatMetaSchemaError = (error, rootPath) => {
  const ALLOWED_TYPE_NAMES = [
    'object',
    'array',
    'string',
    'number',
    'integer',
    'boolean',
    'null',
  ];
  const relativePath = error.property.replace(/^instance\.?/, '');
  const fullPath = relativePath ? `${rootPath}.${relativePath}` : rootPath;

  // "type" field: invalid JSON Schema type value
  if (/\.type$/.test(error.property) || error.property === 'instance.type') {
    if (error.name === 'anyOf') {
      const value = error.instance;
      if (typeof value === 'string') {
        return `${fullPath}: invalid type "${value}". Must be one of: ${ALLOWED_TYPE_NAMES.join(', ')}`;
      }
      if (Array.isArray(value)) {
        const invalid = value.filter(
          (t) => typeof t !== 'string' || !ALLOWED_TYPE_NAMES.includes(t),
        );
        if (invalid.length > 0) {
          return invalid
            .map(
              (t) =>
                `${fullPath}: invalid type "${t}". Must be one of: ${ALLOWED_TYPE_NAMES.join(', ')}`,
            )
            .join('; ');
        }
        return `${fullPath}: must be a string or array of strings`;
      }
      return `${fullPath}: must be a string or array of strings`;
    }
  }

  // Non-object where a JSON Schema object is expected
  // Draft 7 allows boolean schemas, so argument may be ['object', 'boolean']
  if (
    error.name === 'type' &&
    Array.isArray(error.argument) &&
    error.argument.includes('object')
  ) {
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

// Resolves which meta-schema to validate against based on the $schema field.
// Returns { metaSchema, error } where error is a string if $schema is unsupported.
const resolveMetaSchema = (schema) => {
  if (!schema.$schema) {
    return { metaSchema: draft7MetaSchema, error: null };
  }

  if (typeof schema.$schema !== 'string') {
    return { metaSchema: null, error: '`$schema` must be a string' };
  }

  const normalizedUri = schema.$schema
    .replace(/#$/, '')
    .replace(/^https:/, 'http:');
  const metaSchema = SUPPORTED_META_SCHEMAS[normalizedUri];

  if (!metaSchema) {
    const supported = Object.keys(SUPPORTED_META_SCHEMAS).join(', ');
    return {
      metaSchema: null,
      error: `unsupported JSON Schema version "${schema.$schema}". Supported versions: ${supported}`,
    };
  }

  return { metaSchema, error: null };
};

// Validates that an object is a structurally valid JSON schema
// using the appropriate meta-schema via jsonschema library.
// Returns an array of error message strings
const collectSchemaErrors = (schema, rootPath) => {
  if (typeof schema !== 'object' || schema === null || Array.isArray(schema)) {
    return [`${rootPath}: must be a valid JSON Schema object`];
  }

  const { metaSchema, error } = resolveMetaSchema(schema);
  if (error) {
    return [`${rootPath}: ${error}`];
  }

  const result = metaValidator.validate(schema, metaSchema);
  return result.errors.map((err) => formatMetaSchemaError(err, rootPath));
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
      // Root schema type must be object or array, not primitives
      const rootType = field.schema.type;
      if (rootType !== undefined) {
        const types = Array.isArray(rootType) ? rootType : [rootType];
        const invalidTypes = types.filter(
          (t) => t !== 'object' && t !== 'array',
        );
        if (invalidTypes.length > 0) {
          errors.push(
            new jsonschema.ValidationError(
              `has an invalid JSON Schema in \`schema\`: schema: root \`type\` must be "object" or "array", got ${invalidTypes.map((t) => `"${t}"`).join(', ')}`,
              field,
              '/PlainInputFieldSchema',
              path,
              'invalidJsonSchema',
              'schema',
            ),
          );
          // Skip meta-schema validation if root type is invalid
          return errors;
        }
      }

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

const validateJsonFieldSchema = (definition, mainSchema) => {
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

module.exports = validateJsonFieldSchema;
