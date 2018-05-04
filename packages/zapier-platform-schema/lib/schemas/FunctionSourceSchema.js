'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/FunctionSourceSchema',
  description:
    'Source code like {source: "return 1 + 2"} which the system will wrap in a function for you.',
  examples: [{ source: 'return 1 + 2' }],
  antiExamples: [{ source: '1 + 2' }],
  type: 'object',
  additionalProperties: false,
  required: ['source'],
  properties: {
    source: { type: 'string', pattern: 'return' }
  }
});
