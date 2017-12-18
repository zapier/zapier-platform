'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/AuthenticationDigestConfigSchema',
  description:
    'Config for Digest Authentication. No extra properties are required to setup Digest Auth, so you can leave this empty if your app uses Digets Auth.',
  type: 'object',
  properties: {},
  additionalProperties: false
});
