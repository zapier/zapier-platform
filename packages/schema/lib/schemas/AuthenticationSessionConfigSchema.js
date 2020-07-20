'use strict';

const makeSchema = require('../utils/makeSchema');

const RequestSchema = require('./RequestSchema');
const FunctionSchema = require('./FunctionSchema');

module.exports = makeSchema(
  {
    id: '/AuthenticationSessionConfigSchema',
    description: 'Config for session authentication.',
    type: 'object',
    required: ['perform'],
    properties: {
      perform: {
        description:
          'Define how Zapier fetches the additional authData needed to make API calls.',
        oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }],
      },
    },
    additionalProperties: false,
  },
  [FunctionSchema, RequestSchema]
);
