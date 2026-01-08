'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const actionTypes = ['triggers', 'searches', 'creates', 'bulkReads'];
const resourceMethods = ['get', 'list', 'hook', 'search', 'create'];

/**
 * Parse resource reference, supporting dot notation for field references.
 * @param {string} resourceRef - e.g., "spreadsheet" or "spreadsheet.url"
 * @returns {{ resourceKey: string, fieldKey: string | null }}
 */
const parseResourceRef = (resourceRef) => {
  const dotIndex = resourceRef.indexOf('.');
  if (dotIndex === -1) {
    return { resourceKey: resourceRef, fieldKey: null };
  }
  return {
    resourceKey: resourceRef.slice(0, dotIndex),
    fieldKey: resourceRef.slice(dotIndex + 1),
  };
};

/**
 * Validates that resource references in input fields exist in definition.resources.
 */
const validateResourceReferences = (
  inputFields,
  validResourceKeys,
  basePath,
) => {
  const errors = [];

  const checkField = (field, fieldPath) => {
    if (field.resource) {
      const { resourceKey } = parseResourceRef(field.resource);

      if (!validResourceKeys.has(resourceKey)) {
        const availableResources =
          Array.from(validResourceKeys).length > 0
            ? `[${Array.from(validResourceKeys).join(', ')}]`
            : '[] (no resources defined)';

        errors.push(
          new jsonschema.ValidationError(
            `Resource "${resourceKey}" is not defined in resources. Available resources: ${availableResources}`,
            field.resource,
            '/PlainInputFieldSchema',
            `${fieldPath}.resource`,
            'invalidResourceReference',
            'resource',
          ),
        );
      }
    }

    // Check children fields recursively
    (field.children || []).forEach((childField, childIndex) => {
      checkField(childField, `${fieldPath}.children[${childIndex}]`);
    });
  };

  inputFields.forEach((field, index) => {
    checkField(field, `${basePath}.inputFields[${index}]`);
  });

  return errors;
};

const resourceConstraints = (definition) => {
  // Collect valid resource keys from definition.resources
  const validResourceKeys = new Set(Object.keys(definition.resources || {}));

  // If no resources defined, skip validation
  // (resource references might be to implicit resources derived from dynamic dropdowns)
  if (validResourceKeys.size === 0) {
    return [];
  }

  const errors = [];

  // Validate action types (triggers, searches, creates, bulkReads)
  for (const actionType of actionTypes) {
    const group = definition[actionType] || {};
    _.each(group, (action, actionKey) => {
      const inputFields = _.get(action, ['operation', 'inputFields'], []);
      const basePath = `instance.${actionType}.${actionKey}.operation`;

      errors.push(
        ...validateResourceReferences(inputFields, validResourceKeys, basePath),
      );
    });
  }

  // Validate resource methods
  if (definition.resources) {
    _.each(definition.resources, (resource, resourceKey) => {
      resourceMethods.forEach((method) => {
        if (resource[method] && resource[method].operation) {
          const inputFields = _.get(
            resource[method],
            ['operation', 'inputFields'],
            [],
          );
          const basePath = `instance.resources.${resourceKey}.${method}.operation`;

          errors.push(
            ...validateResourceReferences(
              inputFields,
              validResourceKeys,
              basePath,
            ),
          );
        }
      });
    });
  }

  return errors;
};

module.exports = resourceConstraints;
