'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/AuthenticationDigestConfigSchema',
  description: 'Config for digest authentication schema.',
  type: 'object',
  properties: {},
  additionalProperties: false
});
