'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const actionTypes = ['triggers', 'searches', 'creates', 'bulkReads'];
const resourceMethods = ['get', 'list', 'hook', 'search', 'create'];

const validateInputFieldGroups = (
  inputFields,
  inputFieldGroups,
  basePath,
  schemaName,
) => {
  const errors = [];

  // Check for duplicate group keys in inputFieldGroups
  const groupKeys = inputFieldGroups.map((group) => group.key);
  const duplicateKeys = groupKeys.filter(
    (key, index) => groupKeys.indexOf(key) !== index,
  );

  if (duplicateKeys.length > 0) {
    duplicateKeys.forEach((duplicateKey) => {
      const duplicateIndex = groupKeys.lastIndexOf(duplicateKey);
      errors.push(
        new jsonschema.ValidationError(
          `Duplicate group key "${duplicateKey}" found in inputFieldGroups. Group keys must be unique.`,
          inputFieldGroups[duplicateIndex],
          schemaName,
          `${basePath}.inputFieldGroups[${duplicateIndex}].key`,
          'duplicateGroupKey',
          'inputFieldGroups',
        ),
      );
    });
  }

  // Create a set of valid group keys
  const validGroupKeys = new Set(groupKeys);

  inputFields.forEach((inputField, index) => {
    // Check children fields first - groups are not allowed in children
    (inputField.children || []).forEach((childField, childIndex) => {
      if (childField.group) {
        errors.push(
          new jsonschema.ValidationError(
            `Group fields are not allowed in children fields. Remove the group property from this field.`,
            childField.group,
            '/PlainInputFieldSchema',
            `${basePath}.inputFields[${index}].children[${childIndex}].group`,
            'groupInChildren',
            'group',
          ),
        );
      }
    });

    // Check if group reference is valid
    if (inputField.group) {
      if (!validGroupKeys.has(inputField.group)) {
        const availableGroups =
          Array.from(validGroupKeys).length > 0
            ? `[${Array.from(validGroupKeys).join(', ')}]`
            : '[]';
        errors.push(
          new jsonschema.ValidationError(
            `Group "${inputField.group}" is not defined in inputFieldGroups. Available groups: ${availableGroups}`,
            inputField.group,
            '/PlainInputFieldSchema',
            `${basePath}.inputFields[${index}].group`,
            'invalidGroupReference',
            'group',
          ),
        );
      }
    }
  });

  return errors;
};

const inputFieldGroupsConstraints = (definition) => {
  const errors = [];

  // Validate action types (triggers, searches, creates, bulkReads)
  for (const actionType of actionTypes) {
    const group = definition[actionType] || {};
    _.each(group, (action, actionKey) => {
      const inputFields = _.get(action, ['operation', 'inputFields'], []);
      const inputFieldGroups = _.get(
        action,
        ['operation', 'inputFieldGroups'],
        [],
      );

      const basePath = `instance.${actionType}.${actionKey}.operation`;
      const schemaName = '/BasicOperationSchema';

      const actionErrors = validateInputFieldGroups(
        inputFields,
        inputFieldGroups,
        basePath,
        schemaName,
      );
      errors.push(...actionErrors);
    });
  }

  // Validate resources
  if (definition.resources) {
    _.each(definition.resources, (resource, resourceKey) => {
      resourceMethods.forEach((method) => {
        if (resource[method] && resource[method].operation) {
          const inputFields = _.get(
            resource[method],
            ['operation', 'inputFields'],
            [],
          );
          const inputFieldGroups = _.get(
            resource[method],
            ['operation', 'inputFieldGroups'],
            [],
          );

          const basePath = `instance.resources.${resourceKey}.${method}.operation`;
          const schemaName = '/BasicOperationSchema';

          const resourceErrors = validateInputFieldGroups(
            inputFields,
            inputFieldGroups,
            basePath,
            schemaName,
          );
          errors.push(...resourceErrors);
        }
      });
    });
  }

  return errors;
};

module.exports = inputFieldGroupsConstraints;
