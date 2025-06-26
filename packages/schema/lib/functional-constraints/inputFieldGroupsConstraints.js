'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const actionTypes = ['triggers', 'searches', 'creates'];

const inputFieldGroupsConstraints = (definition) => {
  const errors = [];

  for (const actionType of actionTypes) {
    const group = definition[actionType] || {};
    _.each(group, (action, actionKey) => {
      const inputFields = _.get(action, ['operation', 'inputFields'], []);
      const inputFieldGroups = _.get(
        action,
        ['operation', 'inputFieldGroups'],
        [],
      );

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
              '/BasicOperationSchema',
              `instance.${actionType}.${actionKey}.operation.inputFieldGroups[${duplicateIndex}].key`,
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
                `instance.${actionType}.${actionKey}.operation.inputFields[${index}].children[${childIndex}].group`,
                'groupInChildren',
                'group',
              ),
            );
          }
        });

        // Check if group reference is valid
        if (inputField.group) {
          if (!validGroupKeys.has(inputField.group)) {
            errors.push(
              new jsonschema.ValidationError(
                `Group "${inputField.group}" is not defined in inputFieldGroups. Available groups: [${Array.from(validGroupKeys).join(', ')}]`,
                inputField.group,
                '/PlainInputFieldSchema',
                `instance.${actionType}.${actionKey}.operation.inputFields[${index}].group`,
                'invalidGroupReference',
                'group',
              ),
            );
          }
        }
      });
    });
  }

  return errors;
};

module.exports = inputFieldGroupsConstraints;
