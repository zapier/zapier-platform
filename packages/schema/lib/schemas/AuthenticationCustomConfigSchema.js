'use strict';

const makeSchema = require('../utils/makeSchema');
const OTPSchema = require('./OTPSchema');

module.exports = makeSchema({
  id: '/AuthenticationCustomConfigSchema',
  description:
    'Config for custom authentication (like API keys). No extra properties are required to setup this auth type, so you can leave this empty if your app uses a custom auth method.',
  type: 'object',
  properties: {
    [OTPSchema.id]: OTPSchema,
  },
  additionalProperties: false,
  examples: [{}],
  antiExamples: [{ example: { foo: true }, reason: 'Invalid key.' }],
});
