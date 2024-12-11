'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const pollingThrottle = (definition) => {
  const errors = [];
  const actionType = 'triggers';

  if (definition[actionType]) {
    _.each(definition[actionType], (actionDef) => {
      if (
        actionDef.operation &&
        actionDef.operation.throttle &&
        _.has(actionDef.operation.throttle, 'retry') &&
        (!actionDef.operation.type || actionDef.operation.type === 'polling')
      ) {
        errors.push(
          new jsonschema.ValidationError(
            'must not use the "retry" field for a polling trigger.',
            actionDef.operation.throttle,
            '/ThrottleObjectSchema',
            `instance.${actionType}.${actionDef.key}.operation.throttle`,
            'invalid',
            'throttle',
          ),
        );
      }
    });
  }

  return errors;
};

module.exports = pollingThrottle;
