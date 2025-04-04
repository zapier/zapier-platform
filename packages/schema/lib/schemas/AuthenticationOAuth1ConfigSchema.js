'use strict';

const makeSchema = require('../utils/makeSchema');

const FunctionSchema = require('./FunctionSchema');
const RedirectRequestSchema = require('./RedirectRequestSchema');
const RequestSchema = require('./RequestSchema');

module.exports = makeSchema(
  {
    id: '/AuthenticationOAuth1ConfigSchema',
    description: 'Config for OAuth1 authentication.',
    type: 'object',
    required: ['getRequestToken', 'authorizeUrl', 'getAccessToken'],
    properties: {
      getRequestToken: {
        description:
          'Define where Zapier will acquire a request token which is used for the rest of the three legged authentication process.',
        oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }],
      },
      authorizeUrl: {
        description:
          'Define where Zapier will redirect the user to authorize our app. Typically, you should append an `oauth_token` querystring parameter to the request.',
        oneOf: [
          { $ref: RedirectRequestSchema.id },
          { $ref: FunctionSchema.id },
        ],
      },
      getAccessToken: {
        description: 'Define how Zapier fetches an access token from the API',
        oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }],
      },
    },
    additionalProperties: false,
    examples: [
      {
        getRequestToken: { require: 'some/path/to/file.js' },
        authorizeUrl: { require: 'some/path/to/file2.js' },
        getAccessToken: { require: 'some/path/to/file3.js' },
      },
    ],
    antiExamples: [
      {
        example: {
          getRequestToken: { require: 'some/path/to/file.js' },
          authorizeUrl: { require: 'some/path/to/file2.js' },
        },
        reason: 'Missing required key.',
      },
    ],
  },
  [FunctionSchema, RedirectRequestSchema, RequestSchema],
);
