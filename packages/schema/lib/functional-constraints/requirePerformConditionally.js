'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const requirePerformConditionally = (definition) => {
  const errors = [];
  const actionType = 'creates';

  if (definition[actionType]) {
    _.each(definition[actionType], (actionDef) => {
      if (
        actionDef.operation &&
        !actionDef.operation.buffer &&
        !actionDef.operation.performBuffer &&
        !actionDef.operation.perform
      ) {
        errors.push(
          new jsonschema.ValidationError(
            'requires property "perform".',
            actionDef.operation,
            '/BasicCreateActionOperationSchema',
            `instance.${actionType}.${actionDef.key}.operation`,
            'required',
            'perform',
          ),
        );
      }
    });
  }

  return errors;
};

module.exports = requirePerformConditionally;
