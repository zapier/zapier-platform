'use strict';

const makeSchema = require('../utils/makeSchema');

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
  },
  [BulkReadSchema]
);
