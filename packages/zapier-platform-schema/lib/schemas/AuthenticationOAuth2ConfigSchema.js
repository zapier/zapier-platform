'use strict';

const makeSchema = require('../utils/makeSchema');

const FunctionSchema = require('./FunctionSchema');
const RedirectRequestSchema = require('./RedirectRequestSchema');
const RequestSchema = require('./RequestSchema');

module.exports = makeSchema({
  id: '/AuthenticationOAuth2ConfigSchema',
  description: 'Config for OAuth2 authentication schema.',
  type: 'object',
  required: ['authorizeUrl', 'getAccessToken'],
  properties: {
    authorizeUrl: {
      description: 'Where will we redirect the user to authorize our app? Note: we append the redirect URL and state parameters to return value of this function.',
      oneOf: [
        {$ref: RedirectRequestSchema.id},
        {$ref: FunctionSchema.id}
      ]
    },
    getAccessToken: {
      description: 'How will we get the access token?',
      oneOf: [
        {$ref: RequestSchema.id},
        {$ref: FunctionSchema.id}
      ]
    },
    refreshAccessToken: {
      description: 'How will we refresh the access token?',
      oneOf: [
        {$ref: RequestSchema.id},
        {$ref: FunctionSchema.id}
      ]
    },
    scope: {
      description: 'What scope should we request?',
      type: 'string'
    },
    autoRefresh: {
      description: 'Should we refresh the access token?',
      type: 'boolean'
    }
  },
  additionalProperties: false
}, [
  FunctionSchema,
  RedirectRequestSchema,
  RequestSchema
]);
