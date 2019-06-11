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
        $ref: KeySchema.id
      },
      display: {
        description: 'Configures the UI for this search-or-create.',
        $ref: BasicDisplaySchema.id
      },
      search: {
        description: 'The key of the search that powers this search-or-create',
        $ref: KeySchema.id
      },
      create: {
        description: 'The key of the create that powers this search-or-create',
        $ref: KeySchema.id
      }
    },
    additionalProperties: false
  },
  [BasicDisplaySchema, KeySchema]
);
