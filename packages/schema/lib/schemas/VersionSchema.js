'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/VersionSchema',
  description:
    'Represents a simplified semver string, from `0.0.0` to `999.999.999` with optional simplified label. They need to be case-insensitive unique.',
  type: 'string',
  pattern:
    // this is mirrored in ZapierBaseCommand.js and developer_cli/constants.py
    '^(?:0|[1-9]\\d{0,2})\\.(?:0|[1-9]\\d{0,2})\\.(?:0|[1-9]\\d{0,2})(?:-(?=.{1,12}$)[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)?$',
  minLength: 5,
  maxLength: 24,
  examples: ['1.0.0', '2.11.3', '999.999.999', '1.2.0-beta', '0.0.0-ISSUE-123'],
  antiExamples: [
    { example: '1.0.0.0', reason: 'Must have 2 periods' },
    { example: '1000.0.0', reason: 'Each number can be a maximum of 3 digits' },
    { example: 'v1.0.0', reason: 'No letter prefix allowed' },
    { example: '1.0.0-rc.1', reason: 'No periods allowed in label' },
    { example: '1.0.0--', reason: 'No repeated dashes allowed' },
    {
      example: '1.0.0-foo--bar',
      reason: 'No repeated dashes allowed in label',
    },
    { example: '1.0.0-', reason: 'No empty label allowed' },
    { example: '1.0.0-foo-', reason: 'No trailing dash allowed in label' },
  ],
});
