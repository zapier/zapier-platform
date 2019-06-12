'use strict';

const makeSchema = require('../utils/makeSchema');

const FunctionSchema = require('./FunctionSchema');
const RedirectRequestSchema = require('./RedirectRequestSchema');
const RequestSchema = require('./RequestSchema');

module.exports = makeSchema(
  {
    id: '/AuthenticationOAuth2ConfigSchema',
    description: 'Config for OAuth2 authentication.',
    type: 'object',
    required: ['authorizeUrl', 'getAccessToken'],
    properties: {
      authorizeUrl: {
        description:
          'Define where Zapier will redirect the user to authorize our app. Note: we append the redirect URL and state parameters to return value of this function.',
        oneOf: [{ $ref: RedirectRequestSchema.id }, { $ref: FunctionSchema.id }]
      },
      getAccessToken: {
        description: 'Define how Zapier fetches an access token from the API',
        oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }]
      },
      refreshAccessToken: {
        description:
          'Define how Zapier will refresh the access token from the API',
        oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }]
      },
      scope: {
        description: 'What scope should Zapier request?',
        type: 'string'
      },
      autoRefresh: {
        description:
          'Should Zapier include a pre-built afterResponse middleware that invokes `refreshAccessToken` when we receive a 401 response?',
        type: 'boolean'
      }
    },
    additionalProperties: false
  },
  [FunctionSchema, RedirectRequestSchema, RequestSchema]
);
