'use strict';

const makeSchema = require('../utils/makeSchema');
const { SKIP_KEY } = require('../constants');

const CreateSchema = require('./CreateSchema');

module.exports = makeSchema(
  {
    id: '/CreatesSchema',
    description: 'Enumerates the creates your app has available for users.',
    type: 'object',
    patternProperties: {
      '^[a-zA-Z]+[a-zA-Z0-9_]*$': {
        description:
          'Any unique key can be used and its values will be validated against the CreateSchema.',
        $ref: CreateSchema.id,
      },
    },
    additionalProperties: false,
    examples: [
      {
        createRecipe: {
          key: 'createRecipe',
          noun: 'Recipe',
          display: {
            label: 'Create Recipe',
            description: 'Creates a new recipe.',
          },
          operation: { perform: '$func$2$f$', sample: { id: 1 } },
        },
      },
      {
        Create_Recipe_01: {
          key: 'Create_Recipe_01',
          noun: 'Recipe',
          display: {
            label: 'Create Recipe',
            description: 'Creates a new recipe.',
          },
          operation: { perform: '$func$2$f$', sample: { id: 1 } },
        },
      },
    ],
    antiExamples: [
      {
        [SKIP_KEY]: true, // Cannot validate that key matches pattern
        example: {
          '01_Create_Recipe': {
            key: '01_Create_Recipe',
            noun: 'Recipe',
            display: {
              label: 'Create Recipe',
              description: 'Creates a new recipe.',
            },
            operation: { perform: '$func$2$f$', sample: { id: 1 } },
          },
        },
        reason: 'Key must start with a letter',
      },
      {
        [SKIP_KEY]: true, // Cannot validate that keys match
        example: {
          Create_Recipe: {
            key: 'createRecipe',
            noun: 'Recipe',
            display: {
              label: 'Create Recipe',
              description: 'Creates a new recipe.',
            },
            operation: { perform: '$func$2$f$', sample: { id: 1 } },
          },
        },
        reason: 'Key must match the key field in CreateSchema',
      },
    ],
  },
  [CreateSchema],
);
