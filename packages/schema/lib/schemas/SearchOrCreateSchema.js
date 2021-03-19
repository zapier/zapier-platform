'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const KeySchema = require('./KeySchema');

module.exports = makeSchema(
  {
    id: '/SearchOrCreateSchema',
    description:
      'Pair an existing search and a create to enable "Find or Create" functionality in your app',
    type: 'object',
    required: ['key', 'display', 'search', 'create'],
    properties: {
      key: {
        description:
          'A key to uniquely identify this search-or-create. Must match the search key.',
        $ref: KeySchema.id,
      },
      display: {
        description: 'Configures the UI for this search-or-create.',
        $ref: BasicDisplaySchema.id,
      },
      search: {
        description: 'The key of the search that powers this search-or-create',
        $ref: KeySchema.id,
      },
      create: {
        description: 'The key of the create that powers this search-or-create',
        $ref: KeySchema.id,
      },
    },
    additionalProperties: false,
    examples: [
      {
        key: 'searchOrCreateWidgets',
        display: {
          label: 'Search or Create Widgets',
          description:
            'Searches for a widget matching the provided query, or creates one if it does not exist.',
          important: true,
          hidden: false,
        },
        search: 'searchWidgets',
        create: 'createWidget',
      },
    ],
    antiExamples: [
      {
        example: {
          key: '01_Search_or_Create_Widgets',
          display: {
            label: 'Search or Create Widgets',
            description:
              'Searches for a widget matching the provided query, or creates one if it does not exist.',
            important: true,
            hidden: false,
          },
          search: 'searchWidgets',
          create: 'createWidget',
        },
        reason: 'Invalid value for key: key (must start with a letter)',
      },
      {
        example: {
          key: 'searchOrCreateWidgets',
          display: {
            label: 'Search or Create Widgets',
            description:
              'Searches for a widget matching the provided query, or creates one if it does not exist.',
            important: true,
            hidden: false,
          },
          search: { require: 'path/to/some/file.js' },
          create: { require: 'path/to/some/file.js' },
        },
        reason:
          'Invalid values for keys: search and create (must be a string that matches the key of a registered search or create)',
      },
    ],
  },
  [BasicDisplaySchema, KeySchema]
);
