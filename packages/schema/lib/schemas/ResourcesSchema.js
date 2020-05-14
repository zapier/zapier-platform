'use strict';

const makeSchema = require('../utils/makeSchema');
const ResourceSchema = require('./ResourceSchema');

module.exports = makeSchema(
  {
    id: '/ResourcesSchema',
    description:
      'All the resources that underlie common CRUD methods powering automatically handled triggers, creates, and searches for your app. Zapier will break these apart for you.',
    type: 'object',
    patternProperties: {
      '^[a-zA-Z]+[a-zA-Z0-9_]*$': {
        description:
          'Any unique key can be used and its values will be validated against the ResourceSchema.',
        $ref: ResourceSchema.id,
      },
    },
    additionalProperties: false,
  },
  [ResourceSchema]
);
