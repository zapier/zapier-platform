'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/VersionSchema',
  description:
    'Represents a simplified semver string, from `0.0.0` to `999.999.999`.',
  type: 'string',
  pattern: '^[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}$',
  examples: ['1.0.0', '2.11.3', '999.999.999'],
  antiExamples: [
    { example: '1.0.0.0', reason: 'Must have only 2 periods' },
    { example: '1000.0.0', reason: 'Each number can be a maximum of 3 digits' },
    { example: 'v1.0.0', reason: 'No letters allowed' },
    { example: '1.0.0-beta', reson: 'No letters allowed' },
  ],
});
