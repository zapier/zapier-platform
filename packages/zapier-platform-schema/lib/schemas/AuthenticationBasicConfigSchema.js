'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/AuthenticationBasicConfigSchema',
  description: 'Config for basic authentication schema.',
  type: 'object',
  properties: {},
  additionalProperties: false
});
