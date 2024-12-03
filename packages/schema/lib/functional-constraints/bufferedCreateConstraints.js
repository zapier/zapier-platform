'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const bufferedCreateConstraints = (definition) => {
  const errors = [];
  const actionType = 'creates';

  if (definition[actionType]) {
    _.each(definition[actionType], (actionDef) => {
      if (actionDef.operation && actionDef.operation.buffer) {
        if (!actionDef.operation.performBuffer) {
          errors.push(
            new jsonschema.ValidationError(
              'must contain property "performBuffer" because property "buffer" is present.',
              actionDef.operation,
              '/BasicCreateActionOperationSchema',
              `instance.${actionType}.${actionDef.key}.operation`,
              'missing',
              'performBuffer',
            ),
          );
        }

        if (actionDef.operation.perform) {
          errors.push(
            new jsonschema.ValidationError(
              'must not contain property "perform" because it is mutually exclusive with property "buffer".',
              actionDef.operation,
              '/BasicCreateActionOperationSchema',
              `instance.${actionType}.${actionDef.key}.operation`,
              'invalid',
              'perform',
            ),
          );
        }

        if (actionDef.operation.buffer.groupedBy) {
          const requiredInputFields = [];
          const inputFields = _.get(
            actionDef,
            ['operation', 'inputFields'],
            [],
          );
          inputFields.forEach((inputField) => {
            if (inputField.required) {
              requiredInputFields.push(inputField.key);
            }
          });

          actionDef.operation.buffer.groupedBy.forEach((field, index) => {
            if (!requiredInputFields.includes(field)) {
              errors.push(
                new jsonschema.ValidationError(
                  `cannot use optional or non-existent inputField "${field}".`,
                  actionDef.operation.buffer,
                  '/BufferConfigSchema',
                  `instance.${actionType}.${actionDef.key}.operation.buffer.groupedBy[${index}]`,
                  'invalid',
                  'groupedBy',
                ),
              );
            }
          });
        }
      }

      if (actionDef.operation && actionDef.operation.performBuffer) {
        if (!actionDef.operation.buffer) {
          errors.push(
            new jsonschema.ValidationError(
              'must contain property "buffer" because property "performBuffer" is present.',
              actionDef.operation,
              '/BasicCreateActionOperationSchema',
              `instance.${actionType}.${actionDef.key}.operation`,
              'missing',
              'buffer',
            ),
          );
        }

        if (actionDef.operation.perform) {
          errors.push(
            new jsonschema.ValidationError(
              'must not contain property "perform" because it is mutually exclusive with property "performBuffer".',
              actionDef.operation,
              '/BasicCreateActionOperationSchema',
              `instance.${actionType}.${actionDef.key}.operation`,
              'invalid',
              'perform',
            ),
          );
        }
      }
    });
  }

  return errors;
};

module.exports = bufferedCreateConstraints;
