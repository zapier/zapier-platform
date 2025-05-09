'use strict';

const makeSchema = require('../utils/makeSchema');

const PlainOutputFieldSchema = require('./PlainOutputFieldSchema');
const FunctionSchema = require('./FunctionSchema');

module.exports = makeSchema(
  {
    id: '/OutputFieldsSchema',
    description: 'An array or collection of output fields.',
    type: 'array',
    items: {
      oneOf: [{ $ref: PlainOutputFieldSchema.id }, { $ref: FunctionSchema.id }],
    },
    examples: [[{ key: 'abc' }]],
    antiExamples: [{ example: {}, reason: 'Must be an array' }],
  },
  [PlainOutputFieldSchema, FunctionSchema],
);
