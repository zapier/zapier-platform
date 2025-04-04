'use strict';

const makeSchema = require('../utils/makeSchema');
const { SKIP_KEY } = require('../constants');

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
        $ref: TriggerSchema.id,
      },
    },
    additionalProperties: false,
    examples: [
      {
        newRecipe: {
          key: 'newRecipe',
          noun: 'Recipe',
          display: {
            label: 'New Recipe',
            description: 'Triggers when a new recipe is added.',
          },
          operation: {
            type: 'polling',
            perform: '$func$0$f$',
            sample: { id: 1 },
          },
        },
      },
    ],
    antiExamples: [
      {
        example: {
          [SKIP_KEY]: true, // Cannot validate that keys don't match
          newRecipe: {
            key: 'new_recipe',
            noun: 'Recipe',
            display: {
              label: 'New Recipe',
              description: 'Triggers when a new recipe is added.',
            },
            operation: {
              type: 'polling',
              perform: '$func$0$f$',
              sample: { id: 1 },
            },
          },
        },
        reason: 'Key must match the key on the associated /TriggerSchema',
      },
    ],
  },
  [TriggerSchema],
);
