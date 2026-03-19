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

/**
 * Recursively validates that an object is a structurally valid JSON Schema.
 * Returns an array of error message strings.
 */
const collectSchemaErrors = (schema, path) => {
  const errors = [];

  if (typeof schema !== 'object' || schema === null || Array.isArray(schema)) {
    errors.push(`${path}: must be a valid JSON Schema object`);
    return errors;
  }

  // Validate "type"
  if ('type' in schema) {
    if (typeof schema.type === 'string') {
      if (!VALID_JSON_SCHEMA_TYPES.includes(schema.type)) {
        errors.push(
          `${path}.type: invalid type "${schema.type}". Must be one of: ${VALID_JSON_SCHEMA_TYPES.join(', ')}`,
        );
      }
    } else if (Array.isArray(schema.type)) {
      schema.type.forEach((t, i) => {
        if (typeof t !== 'string' || !VALID_JSON_SCHEMA_TYPES.includes(t)) {
          errors.push(
            `${path}.type[${i}]: invalid type "${t}". Must be one of: ${VALID_JSON_SCHEMA_TYPES.join(', ')}`,
          );
        }
      });
    } else {
      errors.push(`${path}.type: must be a string or array of strings`);
    }
  }

  // Validate "properties"
  if ('properties' in schema) {
    if (
      typeof schema.properties !== 'object' ||
      schema.properties === null ||
      Array.isArray(schema.properties)
    ) {
      errors.push(`${path}.properties: must be an object`);
    } else {
      Object.keys(schema.properties).forEach((key) => {
        errors.push(
          ...collectSchemaErrors(
            schema.properties[key],
            `${path}.properties.${key}`,
          ),
        );
      });
    }
  }

  // Validate "items"
  if ('items' in schema) {
    if (Array.isArray(schema.items)) {
      schema.items.forEach((item, i) => {
        errors.push(...collectSchemaErrors(item, `${path}.items[${i}]`));
      });
    } else {
      errors.push(...collectSchemaErrors(schema.items, `${path}.items`));
    }
  }

  // Validate "required"
  if ('required' in schema) {
    if (!Array.isArray(schema.required)) {
      errors.push(`${path}.required: must be an array`);
    } else {
      schema.required.forEach((r, i) => {
        if (typeof r !== 'string') {
          errors.push(`${path}.required[${i}]: must be a string`);
        }
      });
    }
  }

  // Validate "additionalProperties"
  if ('additionalProperties' in schema) {
    if (typeof schema.additionalProperties !== 'boolean') {
      errors.push(
        ...collectSchemaErrors(
          schema.additionalProperties,
          `${path}.additionalProperties`,
        ),
      );
    }
  }

  // Validate "allOf", "anyOf", "oneOf"
  ['allOf', 'anyOf', 'oneOf'].forEach((keyword) => {
    if (keyword in schema) {
      if (!Array.isArray(schema[keyword])) {
        errors.push(`${path}.${keyword}: must be an array`);
      } else {
        schema[keyword].forEach((subSchema, i) => {
          errors.push(
            ...collectSchemaErrors(subSchema, `${path}.${keyword}[${i}]`),
          );
        });
      }
    }
  });

  // Validate "not"
  if ('not' in schema) {
    errors.push(...collectSchemaErrors(schema.not, `${path}.not`));
  }

  // Validate "enum"
  if ('enum' in schema) {
    if (!Array.isArray(schema.enum)) {
      errors.push(`${path}.enum: must be an array`);
    }
  }

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
