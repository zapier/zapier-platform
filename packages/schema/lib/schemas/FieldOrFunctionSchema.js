'use strict';

const makeSchema = require('../utils/makeSchema');

const FieldSchema = require('./FieldSchema');
const FunctionSchema = require('./FunctionSchema');

// This schema was created to improve readability on errors.

module.exports = makeSchema(
  {
    id: '/FieldOrFunctionSchema',
    description: 'Represents an array of fields or functions.',
    examples: [
      [],
      [{ key: 'abc' }],
      [{ key: 'abc' }, '$func$2$f$'],
      ['$func$2$f$', '$func$2$f$'],
    ],
    antiExamples: [[{}], [{ key: 'abc', choices: {} }], '$func$2$f$'],
    type: 'array',
    items: {
      oneOf: [{ $ref: FieldSchema.id }, { $ref: FunctionSchema.id }],
    },
  },
  [FieldSchema, FunctionSchema]
);
