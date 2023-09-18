'use strict';

const makeSchema = require('../utils/makeSchema');
const FunctionSchema = require('./FunctionSchema');
const RedirectRequestSchema = require('./RedirectRequestSchema');

module.exports = makeSchema({
  id: '/OTPSchema',
  description: 'Config for sending an OTP code.',
  type: 'object',
  properties: {
    sendCode: {
      description: 'Define the call Zapier should make to send the OTP code.',
      oneOf: [{ $ref: RedirectRequestSchema.id }, { $ref: FunctionSchema.id }],
    },
  },
  examples: [],
  antiExamples: [],
});
