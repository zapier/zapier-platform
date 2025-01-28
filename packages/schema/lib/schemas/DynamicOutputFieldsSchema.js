'use strict';

const makeSchema = require('../utils/makeSchema');

const OutputFieldSchema = require('./OutputFieldSchema');
const FunctionSchema = require('./FunctionSchema');

module.exports = makeSchema(
  {
    id: '/DynamicOutputFieldsSchema',
    description: 'An array or collection of output fields.',
    type: 'array',
    items: {
      oneOf: [{ $ref: OutputFieldSchema.id }, { $ref: FunctionSchema.id }],
    },
    examples: [[{ key: 'abc' }]],
    antiExamples: [{ example: {}, reason: 'Must be an array' }],
  },
  [OutputFieldSchema, FunctionSchema],
);
