'use strict';

const makeSchema = require('../utils/makeSchema');

const ReadSchema = require('./ReadSchema');

module.exports = makeSchema(
  {
    id: '/ReadsSchema',
    description: 'Enumerates the reads your app exposes.',
    type: 'object',
    patternProperties: {
      '^[a-zA-Z]+[a-zA-Z0-9_]*$': {
        description:
          'Any unique key can be used and its values will be validated against the ReadSchema.',
        $ref: ReadSchema.id
      }
    },
    additionalProperties: false
  },
  [ReadSchema]
);
