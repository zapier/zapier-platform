'use strict';

const makeSchema = require('../utils/makeSchema');

const AuthenticationBasicConfigSchema = require('./AuthenticationBasicConfigSchema.js');
const AuthenticationCustomConfigSchema = require('./AuthenticationCustomConfigSchema.js');
const AuthenticationDigestConfigSchema = require('./AuthenticationDigestConfigSchema.js');
const AuthenticationOAuth1ConfigSchema = require('./AuthenticationOAuth1ConfigSchema.js');
const AuthenticationOAuth2ConfigSchema = require('./AuthenticationOAuth2ConfigSchema.js');
const AuthenticationSessionConfigSchema = require('./AuthenticationSessionConfigSchema.js');
const FunctionSchema = require('./FunctionSchema');
const RequestSchema = require('./RequestSchema');
const AuthFieldsSchema = require('./AuthFieldsSchema');

module.exports = makeSchema(
  {
    id: '/AuthenticationSchema',
    description: 'Represents authentication schemes.',
    type: 'object',
    required: ['type', 'test'],
    properties: {
      type: {
        description: 'Choose which scheme you want to use.',
        type: 'string',
        enum: ['basic', 'custom', 'digest', 'oauth1', 'oauth2', 'session'],
      },
      test: {
        description:
          'A function or request that confirms the authentication is working.',
        oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }],
      },
      fields: {
        description:
          'Fields you can request from the user before they connect your app to Zapier.',
        $ref: AuthFieldsSchema.id,
      },
      connectionLabel: {
        description:
          'A string with variables, function, or request that returns the connection label for the authenticated user.',
        anyOf: [
          { $ref: RequestSchema.id },
          { $ref: FunctionSchema.id },
          { type: 'string' },
        ],
      },
      // this is preferred to laying out config: anyOf: [...]
      basicConfig: { $ref: AuthenticationBasicConfigSchema.id },
      customConfig: { $ref: AuthenticationCustomConfigSchema.id },
      digestConfig: { $ref: AuthenticationDigestConfigSchema.id },
      oauth1Config: { $ref: AuthenticationOAuth1ConfigSchema.id },
      oauth2Config: { $ref: AuthenticationOAuth2ConfigSchema.id },
      sessionConfig: { $ref: AuthenticationSessionConfigSchema.id },
    },
    additionalProperties: false,
    examples: [
      {
        type: 'basic',
        test: '$func$2$f$',
      },
      {
        type: 'custom',
        test: '$func$2$f$',
        fields: [{ key: 'abc' }],
      },
      {
        type: 'custom',
        test: '$func$2$f$',
        connectionLabel: '{{bundle.inputData.abc}}',
      },
      {
        type: 'custom',
        test: '$func$2$f$',
        connectionLabel: '$func$2$f$',
      },
      {
        type: 'custom',
        test: '$func$2$f$',
        connectionLabel: { url: 'abc' },
      },
    ],
    antiExamples: [
      {
        example: {},
        reason: 'Missing required keys: type and test',
      },
      {
        example: '$func$2$f$',
        reason: 'Must be object',
      },
      {
        example: {
          type: 'unknown',
          test: '$func$2$f$',
        },
        reason: 'Invalid value for key: type',
      },
      {
        example: {
          type: 'custom',
          test: '$func$2$f$',
          fields: '$func$2$f$',
        },
        reason: 'Invalid value for key: fields',
      },
    ],
  },
  [
    FunctionSchema,
    RequestSchema,
    AuthFieldsSchema,
    AuthenticationBasicConfigSchema,
    AuthenticationCustomConfigSchema,
    AuthenticationDigestConfigSchema,
    AuthenticationOAuth1ConfigSchema,
    AuthenticationOAuth2ConfigSchema,
    AuthenticationSessionConfigSchema,
  ],
);
