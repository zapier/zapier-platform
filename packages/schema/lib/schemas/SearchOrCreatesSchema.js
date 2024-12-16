'use strict';

const makeSchema = require('../utils/makeSchema');
const { SKIP_KEY } = require('../constants');

const SearchOrCreateSchema = require('./SearchOrCreateSchema');

module.exports = makeSchema(
  {
    id: '/SearchOrCreatesSchema',
    description:
      'Enumerates the search-or-creates your app has available for users.',
    type: 'object',
    patternProperties: {
      '^[a-zA-Z]+[a-zA-Z0-9_]*$': {
        description:
          'Any unique key can be used and its values will be validated against the SearchOrCreateSchema.',
        $ref: SearchOrCreateSchema.id,
      },
    },
    additionalProperties: false,
    examples: [
      {
        searchOrCreateWidgets: {
          key: 'searchOrCreateWidgets',
          display: {
            label: 'Search or Create Widgets',
            description:
              'Searches for a widget matching the provided query, or creates one if it does not exist.',
            hidden: false,
          },
          search: 'searchWidgets',
          create: 'createWidget',
        },
      },
      {
        searchAndCreateWidgets: {
          key: 'searchAndCreateWidgets',
          display: {
            label: 'Search and Create Widgets',
            description:
              'Searches for a widget matching the provided query, creates one if it does not exist or updates existing one if found.',
            hidden: false,
          },
          search: 'searchWidgets',
          create: 'createWidget',
          update: 'updateWidget',
        },
      },
    ],
    antiExamples: [
      {
        [SKIP_KEY]: true, // Cannot validate that keys match
        example: {
          searchOrCreateWidgets: {
            key: 'socWidgets',
            display: {
              label: 'Search or Create Widgets',
              description:
                'Searches for a widget matching the provided query, or creates one if it does not exist.',
              hidden: false,
            },
            search: 'searchWidgets',
            create: 'createWidget',
          },
        },
        reason:
          'Key must match the key of the associated /SearchOrCreateSchema',
      },
    ],
  },
  [SearchOrCreateSchema],
);
