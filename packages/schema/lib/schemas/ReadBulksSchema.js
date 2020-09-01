'use strict';

const makeSchema = require('../utils/makeSchema');

const ReadBulkSchema = require('./ReadBulkSchema');

module.exports = makeSchema(
  {
    id: '/ReadBulksSchema',
    description: 'Enumerates the read bulks your app exposes.',
    type: 'object',
    patternProperties: {
      '^[a-zA-Z]+[a-zA-Z0-9_]*$': {
        description:
          'Any unique key can be used and its values will be validated against the ReadBulkSchema.',
        $ref: ReadBulkSchema.id,
      },
    },
    additionalProperties: false,
  },
  [ReadBulkSchema]
);
