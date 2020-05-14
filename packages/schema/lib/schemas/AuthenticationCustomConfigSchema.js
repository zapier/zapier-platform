'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/AuthenticationCustomConfigSchema',
  description:
    'Config for custom authentication (like API keys). No extra properties are required to setup this auth type, so you can leave this empty if your app uses a custom auth method.',
  type: 'object',
  properties: {},
  additionalProperties: false,
});
