'use strict';

const makeSchema = require('../utils/makeSchema');

const CreateSchema = require('./CreateSchema');

module.exports = makeSchema(
  {
    id: '/CreatesSchema',
    description: 'Enumerates the creates your app has available for users.',
    type: 'object',
    patternProperties: {
      '^[a-zA-Z]+[a-zA-Z0-9_]*$': {
        description:
          'Any unique key can be used and its values will be validated against the CreateSchema.',
        $ref: CreateSchema.id
      }
    }
  },
  [CreateSchema]
);
