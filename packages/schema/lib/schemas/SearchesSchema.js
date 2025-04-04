'use strict';

const makeSchema = require('../utils/makeSchema');
const { SKIP_KEY } = require('../constants');

const SearchSchema = require('./SearchSchema');

module.exports = makeSchema(
  {
    id: '/SearchesSchema',
    description: 'Enumerates the searches your app has available for users.',
    type: 'object',
    patternProperties: {
      '^[a-zA-Z]+[a-zA-Z0-9_]*$': {
        description:
          'Any unique key can be used and its values will be validated against the SearchSchema.',
        $ref: SearchSchema.id,
      },
    },
    additionalProperties: false,
    examples: [
      {
        recipe: {
          key: 'recipe',
          noun: 'Recipe',
          display: {
            label: 'Find a Recipe',
            description: 'Search for recipe by cuisine style.',
            hidden: true,
          },
          operation: { perform: '$func$2$f$' },
        },
      },
    ],
    antiExamples: [
      {
        [SKIP_KEY]: true, // Cannot validate that keys match
        example: {
          searchRecipe: {
            key: 'recipe',
            noun: 'Recipe',
            display: {
              label: 'Find a Recipe',
              description: 'Search for recipe by cuisine style.',
              hidden: true,
            },
            operation: { perform: '$func$2$f$' },
          },
        },
        reason: 'Key must match the key of the associated /SearchSchema',
      },
    ],
  },
  [SearchSchema],
);
