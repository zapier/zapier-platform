'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/FunctionRequireSchema',
  description:
    'A path to a file that might have content like `module.exports = (z, bundle) => [{id: 123}];`.',
  type: 'object',
  required: ['require'],
  properties: {
    require: { type: 'string' },
  },
  additionalProperties: false,
  examples: [{ require: 'some/path/to/file.js' }],
  antiExamples: [
    {
      example: {},
      reason: 'Missing required key: require',
    },
    {
      example: {
        required: 2,
      },
      reason: 'Invalid value for key: required (must be of type string)',
    },
  ],
});
