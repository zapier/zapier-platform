'use strict';

const makeSchema = require('../utils/makeSchema');

const FieldSchema = require('./FieldSchema');
const FunctionSchema = require('./FunctionSchema');

// This schema was created to improve readability on errors.

module.exports = makeSchema(
  {
    id: '/FieldOrFunctionSchema',
    description: 'Represents an array of fields or functions.',
    type: 'array',
    items: {
      oneOf: [{ $ref: FieldSchema.id }, { $ref: FunctionSchema.id }],
    },
    examples: [
      [],
      [{ key: 'abc' }],
      [{ key: 'abc' }, '$func$2$f$'],
      ['$func$2$f$', '$func$2$f$'],
    ],
    antiExamples: [
      {
        example: [{}],
        reason: 'Array item not a valid FieldSchema or FunctionSchema',
      },
      {
        example: [{ key: 'abc', choices: {} }],
        reason: 'Array item not a valid FieldSchema',
      },
      {
        example: '$func$2$f$',
        reason: 'Must be an array',
      },
    ],
  },
  [FieldSchema, FunctionSchema],
);
