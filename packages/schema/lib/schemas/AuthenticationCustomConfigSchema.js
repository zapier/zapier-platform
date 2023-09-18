'use strict';

const makeSchema = require('../utils/makeSchema');
const FunctionSchema = require('./FunctionSchema');
const RequestSchema = require('./RequestSchema');

module.exports = makeSchema({
  id: '/AuthenticationCustomConfigSchema',
  description:
    'Config for custom authentication (like API keys). No extra properties are required to setup this auth type, so you can leave this empty if your app uses a custom auth method.',
  type: 'object',
  properties: {
    sendCode: {
      description: 'Define the call Zapier should make to send the OTP code.',
      oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }],
    },
  },
  additionalProperties: false,
  examples: [{}],
  antiExamples: [{ example: { foo: true }, reason: 'Invalid key.' }],
});
