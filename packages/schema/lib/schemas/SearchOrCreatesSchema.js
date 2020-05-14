'use strict';

const makeSchema = require('../utils/makeSchema');

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
  },
  [SearchOrCreateSchema]
);
