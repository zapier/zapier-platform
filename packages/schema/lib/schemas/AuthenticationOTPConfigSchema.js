'use strict';

const makeSchema = require('../utils/makeSchema');
const RedirectRequestSchema = require('./RedirectRequestSchema');

module.exports = makeSchema({
  id: '/AuthenticationOTPConfigSchema',
  description:
    'Config for OTP Authentication. The user will be prompted to enter a code sent to their phone or email.',
  type: 'object',
  required: ['sendCode'],
  properties: {
    sendCode: {
      description: 'Define the call Zapier should make to send the OTP code.',
      $ref: RedirectRequestSchema.id,
    },
  },
  additionalProperties: false,
  examples: [{}],
  antiExamples: [{ example: { foo: true }, reason: 'Invalid key.' }],
});
