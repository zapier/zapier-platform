'use strict';

const makeSchema = require('../utils/makeSchema');

const AuthenticationBasicConfigSchema = require('./AuthenticationBasicConfigSchema.js');
const AuthenticationCustomConfigSchema = require('./AuthenticationCustomConfigSchema.js');
const AuthenticationDigestConfigSchema = require('./AuthenticationDigestConfigSchema.js');
const AuthenticationOAuth2ConfigSchema = require('./AuthenticationOAuth2ConfigSchema.js');
const AuthenticationSessionConfigSchema = require('./AuthenticationSessionConfigSchema.js');
const FieldsSchema = require('./FieldsSchema');
const FunctionSchema = require('./FunctionSchema');
const RequestSchema = require('./RequestSchema');

module.exports = makeSchema({
  id: '/AuthenticationSchema',
  description: 'Represents authentication schemes.',
  type: 'object',
  required: ['type', 'test'],
  properties: {
    type: {
      description: 'Choose which scheme you want to use.',
      type: 'string',
      enum: [
        'basic',
        'custom',
        'digest',
        'oauth2',
        'session'
      ]
    },
    test: {
      description: 'A function or request that confirms the authentication is working.',
      oneOf: [
        {$ref: RequestSchema.id},
        {$ref: FunctionSchema.id}
      ]
    },
    fields: {
      description: 'Fields you can request of the user before they connect your app to Zapier.',
      $ref: FieldsSchema.id // TODO: can this be DynamicFieldsSchema?
    },
    // this is preferred to laying out config: anyOf: [...]
    basicConfig: {$ref: AuthenticationBasicConfigSchema.id},
    customConfig: {$ref: AuthenticationCustomConfigSchema.id},
    digestConfig: {$ref: AuthenticationDigestConfigSchema.id},
    oauth2Config: {$ref: AuthenticationOAuth2ConfigSchema.id},
    sessionConfig: {$ref: AuthenticationSessionConfigSchema.id}
  },
  additionalProperties: false
}, [
  FieldsSchema,
  FunctionSchema,
  RequestSchema,
  AuthenticationBasicConfigSchema,
  AuthenticationCustomConfigSchema,
  AuthenticationDigestConfigSchema,
  AuthenticationOAuth2ConfigSchema,
  AuthenticationSessionConfigSchema
]);
