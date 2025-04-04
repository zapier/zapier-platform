'use strict';

const makeSchema = require('../utils/makeSchema');
const FunctionSchema = require('./FunctionSchema');
const RequestSchema = require('./RequestSchema');

module.exports = makeSchema(
  {
    id: '/AuthenticationCustomConfigSchema',
    description:
      'Config for custom authentication (like API keys). No extra properties are required to setup this auth type, so you can leave this empty if your app uses a custom auth method.',
    type: 'object',
    properties: {
      sendCode: {
        description:
          'EXPERIMENTAL: Define the call Zapier should make to send the OTP code.',
        oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }],
      },
    },
    additionalProperties: false,
    examples: [
      {},
      {
        sendCode: {
          url: 'https://example.com/api/send',
          headers: { Authorization: `Bearer {{process.env.API_KEY}}` },
          body: {
            to_phone_number: '{{bundle.inputData.phone_number}}',
            code: '{{bundle.inputData.code}}',
          },
        },
      },
    ],
    antiExamples: [{ example: { foo: true }, reason: 'Invalid key.' }],
  },
  [RequestSchema, FunctionSchema],
);
