'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/AuthenticationBasicConfigSchema',
  description:
    'Config for Basic Authentication. No extra properties are required to setup Basic Auth, so you can leave this empty if your app uses Basic Auth.',
  type: 'object',
  properties: {},
  additionalProperties: false,
});
