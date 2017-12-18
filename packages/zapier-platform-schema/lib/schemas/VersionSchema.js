'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/VersionSchema',
  description:
    'Represents a simplified semver string, from `0.0.0` to `999.999.999`.',
  examples: ['1.0.0', '2.11.3', '999.999.999'],
  antiExamples: [
    '1.0.0.0',
    '1000.0.0',
    'v1.0.0',
    '1.0.0-beta',
    '1.0.0-beta.x.y.z',
    '1.0.0-beta+12487'
  ],
  type: 'string',
  pattern: '^[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}$'
});
