'use strict';

const makeSchema = require('../utils/makeSchema');

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
  },
  [SearchSchema]
);
