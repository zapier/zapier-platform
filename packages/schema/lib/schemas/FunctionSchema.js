'use strict';

const makeSchema = require('../utils/makeSchema');

const FunctionRequireSchema = require('./FunctionRequireSchema');
const FunctionSourceSchema = require('./FunctionSourceSchema');

module.exports = makeSchema(
  {
    id: '/FunctionSchema',
    description:
      'Internal pointer to a function from the original source or the source code itself. Encodes arity and if `arguments` is used in the body. Note - just write normal functions and the system will encode the pointers for you. Or, provide {source: "return 1 + 2"} and the system will wrap in a function for you.',
    oneOf: [
      { type: 'string', pattern: '^\\$func\\$\\d+\\$[tf]\\$$' },
      { $ref: FunctionRequireSchema.id },
      { $ref: FunctionSourceSchema.id },
    ],
    examples: [
      '$func$0$f$',
      '$func$2$t$',
      { source: 'return 1 + 2' },
      { require: 'some/path/to/file.js' },
    ],
    antiExamples: [
      {
        example: 'funcy',
        reason: 'Invalid function reference',
      },
      {
        example: { source: '1 + 2' },
        reason:
          'Invalid value for key: source (must end with a `return` statement)',
      },
      {
        example: { source: '1 + 2', require: 'some/path/to/file.js' },
        reason:
          'Must be either /FunctionRequireSchema _or_ /FunctionSourceSchema',
      },
    ],
  },
  [FunctionRequireSchema, FunctionSourceSchema],
);
