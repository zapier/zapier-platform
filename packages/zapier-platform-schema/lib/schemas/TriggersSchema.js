'use strict';

const makeSchema = require('../utils/makeSchema');

const TriggerSchema = require('./TriggerSchema');

module.exports = makeSchema(
  {
    id: '/TriggersSchema',
    description: 'Enumerates the triggers your app has available for users.',
    type: 'object',
    patternProperties: {
      '^[a-zA-Z]+[a-zA-Z0-9_]*$': {
        description:
          'Any unique key can be used and its values will be validated against the TriggerSchema.',
        $ref: TriggerSchema.id
      }
    },
    additionalProperties: false
  },
  [TriggerSchema]
);
