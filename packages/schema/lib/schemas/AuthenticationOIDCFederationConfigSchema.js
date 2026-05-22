'use strict';

const makeSchema = require('../utils/makeSchema');

const RequestSchema = require('./RequestSchema');
const FunctionSchema = require('./FunctionSchema');

module.exports = makeSchema(
  {
    id: '/AuthenticationOIDCFederationConfigSchema',
    description: 'Config for OIDC federation authentication.',
    type: 'object',
    required: ['perform', 'audience'],
    properties: {
      perform: {
        description:
          'Define how Zapier fetches the additional authData needed to make API calls.',
        oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }],
      },
      audience: {
        description: 'The service the OIDC token is generated for.',
        type: 'string',
      },
    },
    additionalProperties: false,
    examples: [
      {
        perform: { require: 'some/path/to/file.js' },
        audience: 'sts.amazonaws.com',
      },
    ],
    antiExamples: [
      {
        example: {},
        reason: 'Missing required key: perform and audience',
      },
      {
        example: {
          perform: { require: 'some/path/to/file.js' },
        },
        reason: 'Missing required key: audience',
      },
    ],
  },
  [FunctionSchema, RequestSchema],
);
