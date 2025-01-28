'use strict';

const makeSchema = require('../utils/makeSchema');

const OutputFieldSchema = require('./OutputFieldSchema');

module.exports = makeSchema(
  {
    id: '/OutputFieldsSchema',
    description: 'An array or collection of output fields.',
    type: 'array',
    items: { $ref: OutputFieldSchema.id },
    examples: [[{ key: 'abc' }]],
    antiExamples: [{ example: {}, reason: 'Must be an array' }],
  },
  [OutputFieldSchema],
);
