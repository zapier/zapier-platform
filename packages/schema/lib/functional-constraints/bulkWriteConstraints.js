'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const bulkWriteConstraints = (definition) => {
  const errors = [];
  const actionType = 'creates';

  if (definition[actionType]) {
    _.each(definition[actionType], (actionDef) => {
      if (actionDef.operation && actionDef.operation.bulk) {
        if (!actionDef.operation.performBulk) {
          errors.push(
            new jsonschema.ValidationError(
              'must contain property "performBulk" because property "bulk" is present.',
              actionDef.operation,
              '/BasicCreateActionOperationSchema',
              `instance.${actionType}.${actionDef.key}.operation`,
              'missing',
              'performBulk'
            )
          );
        }

        if (actionDef.operation.perform) {
          errors.push(
            new jsonschema.ValidationError(
              'must not contain property "perform" because it is mutually exclusive with property "bulk".',
              actionDef.operation,
              '/BasicCreateActionOperationSchema',
              `instance.${actionType}.${actionDef.key}.operation`,
              'invalid',
              'perform'
            )
          );
        }

        if (actionDef.operation.bulk.groupedBy) {
          const requiredInputFields = [];
          const inputFields = _.get(actionDef, ['operation', 'inputFields'], []);
          inputFields.forEach((inputField) => {
            if (inputField.required) {
              requiredInputFields.push(inputField.key);
            }
          });

          actionDef.operation.bulk.groupedBy.forEach((field, index) => {
            if (!requiredInputFields.includes(field)) {
              errors.push(
                new jsonschema.ValidationError(
                  `cannot use optional or non-existent inputField "${field}".`,
                  actionDef.operation.bulk,
                  '/BulkObjectSchema',
                  `instance.${actionType}.${actionDef.key}.operation.bulk.groupedBy[${index}]`,
                  'invalid',
                  'groupedBy'
                )
              );
            }
          });
        }
      }

      if (actionDef.operation && actionDef.operation.performBulk) {
        if (!actionDef.operation.bulk) {
          errors.push(
            new jsonschema.ValidationError(
              'must contain property "bulk" because property "performBulk" is present.',
              actionDef.operation,
              '/BasicCreateActionOperationSchema',
              `instance.${actionType}.${actionDef.key}.operation`,
              'missing',
              'bulk'
            )
          );
        }

        if (actionDef.operation.perform) {
          errors.push(
            new jsonschema.ValidationError(
              'must not contain property "perform" because it is mutually exclusive with property "performBulk".',
              actionDef.operation,
              '/BasicCreateActionOperationSchema',
              `instance.${actionType}.${actionDef.key}.operation`,
              'invalid',
              'perform'
            )
          );
        }
      }
    });
  }

  return errors;
};

module.exports = bulkWriteConstraints;
