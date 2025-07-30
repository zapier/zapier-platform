'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/VersionSchema',
  description:
    'Represents a simplified semver string, from `0.0.0` to `999.999.999` with optional simplified label.',
  type: 'string',
  pattern:
    '^(0|[1-9]\\d{,2})\\.(0|[1-9]\\d{,2})\\.(0|[1-9]\\d{,2})(-[0-9A-Za-z]+)*$',
  minLength: 5,
  maxLength: 24,
  examples: ['1.0.0', '2.11.3', '999.999.999', '1.2.0-beta', '1.3.0-issue-123'],
  antiExamples: [
    { example: '1.0.0.0', reason: 'Must have only 2 periods' },
    { example: '1000.0.0', reason: 'Each number can be a maximum of 3 digits' },
    { example: 'v1.0.0', reason: 'No letter prefix allowed' },
    { example: '1.0.0-rc.1', reason: 'No periods allowed in label' },
  ],
});
