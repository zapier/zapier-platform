'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/FunctionRequireSchema',
  description:
    'A path to a file that might have content like `module.exports = (z, bundle) => [{id: 123}];`.',
  examples: [{ require: 'some/path/to/file.js' }],
  type: 'object',
  additionalProperties: false,
  required: ['require'],
  properties: {
    require: { type: 'string' }
  }
});
