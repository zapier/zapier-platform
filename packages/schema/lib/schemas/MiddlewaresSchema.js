'use strict';

const { SKIP_KEY } = require('../constants');
const makeSchema = require('../utils/makeSchema');
const FunctionSchema = require('./FunctionSchema');

module.exports = makeSchema(
  {
    id: '/MiddlewaresSchema',
    description:
      'List of before or after middlewares. Can be an array of functions or a single function',
    oneOf: [
      {
        type: 'array',
        items: { $ref: FunctionSchema.id },
      },
      { $ref: FunctionSchema.id },
    ],
    additionalProperties: false,
    examples: [
      {
        [SKIP_KEY]: true, // TODO fix this
        require: 'some/path/to/file.js',
      },
      [{ require: 'some/path/to/file.js' }],
    ],
    antiExamples: [
      {
        example: {},
        reason: 'Does not match either /FunctionSchema or an array of such',
      },
    ],
  },
  [FunctionSchema],
);
