'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/AuthenticationCustomConfigSchema',
  description: 'Config for custom authentication schema.',
  type: 'object',
  properties: {},
  additionalProperties: false
});
