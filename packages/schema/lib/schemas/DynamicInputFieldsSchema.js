'use strict';

const makeSchema = require('../utils/makeSchema');

const InputFieldSchema = require('./InputFieldSchema');
const FunctionSchema = require('./FunctionSchema');

module.exports = makeSchema(
  {
    id: '/DynamicInputFieldsSchema',
    description: 'An array or collection of input fields.',
    type: 'array',
    items: {
      oneOf: [{ $ref: InputFieldSchema.id }, { $ref: FunctionSchema.id }],
    },
    examples: [[{ key: 'abc' }]],
    antiExamples: [{ example: {}, reason: 'Must be an array' }],
  },
  [InputFieldSchema, FunctionSchema],
);
