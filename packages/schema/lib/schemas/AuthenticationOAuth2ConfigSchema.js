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
        oneOf: [
          { $ref: RedirectRequestSchema.id },
          { $ref: FunctionSchema.id },
        ],
      },
      getAccessToken: {
        description: 'Define how Zapier fetches an access token from the API',
        oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }],
      },
      refreshAccessToken: {
        description:
          'Define how Zapier will refresh the access token from the API',
        oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }],
      },
      codeParam: {
        description:
          'Define a non-standard code param Zapier should scrape instead.',
        type: 'string',
      },
      scope: {
        description: 'What scope should Zapier request?',
        type: 'string',
      },
      autoRefresh: {
        description:
          'Should Zapier invoke `refreshAccessToken` when we receive an error for a 401 response?',
        type: 'boolean',
      },
      enablePkce: {
        description: 'Should Zapier use PKCE for OAuth2?',
        type: 'boolean',
      },
    },
    additionalProperties: false,
    examples: [
      {
        authorizeUrl: { require: 'some/path/to/file.js' },
        getAccessToken: { require: 'some/path/to/file2.js' },
      },
      {
        authorizeUrl: { require: 'some/path/to/file.js' },
        getAccessToken: { require: 'some/path/to/file2.js' },
        refreshAccessToken: { require: 'some/path/to/file3.js' },
        codeParam: 'unique_code',
        scope: 'read/write',
        autoRefresh: true,
        enablePkce: true,
      },
    ],
    antiExamples: [
      {
        example: {
          authorizeUrl: { require: 'some/path/to/file.js' },
        },
        reason: 'Missing required key getAccessToken.',
      },
    ],
  },
  [FunctionSchema, RedirectRequestSchema, RequestSchema],
);
