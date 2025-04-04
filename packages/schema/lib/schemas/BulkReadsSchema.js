'use strict';

const makeSchema = require('../utils/makeSchema');
const { SKIP_KEY } = require('../constants');

const BulkReadSchema = require('./BulkReadSchema');

module.exports = makeSchema(
  {
    id: '/BulkReadsSchema',
    description: 'Enumerates the bulk reads your app exposes.',
    type: 'object',
    patternProperties: {
      '^[a-zA-Z]+[a-zA-Z0-9_]*$': {
        description:
          'Any unique key can be used and its values will be validated against the BulkReadSchema.',
        $ref: BulkReadSchema.id,
      },
    },
    additionalProperties: false,
    examples: [
      {
        recipes: {
          key: 'recipes',
          noun: 'Recipes',
          display: {
            label: 'Recipes',
            description: 'A Read that lets Zapier fetch all recipes.',
          },
          operation: {
            perform: '$func$0$f$',
            sample: {
              id: 1,
              firstName: 'Walter',
              lastName: 'Sobchak',
              occupation: 'Bowler',
            },
          },
        },
      },
    ],
    antiExamples: [
      {
        [SKIP_KEY]: true, // Cannot validate that keys don't match
        example: {
          readRecipes: {
            key: 'recipes',
            noun: 'Recipes',
            display: {
              label: 'Recipes',
              description: 'A Read that lets Zapier fetch all recipes.',
            },
            operation: {
              perform: '$func$0$f$',
              sample: {
                id: 1,
                firstName: 'Walter',
                lastName: 'Sobchak',
                occupation: 'Bowler',
              },
            },
          },
        },
        reason: 'Key must match the key of the associated BulkReadSchema',
      },
    ],
  },
  [BulkReadSchema],
);
