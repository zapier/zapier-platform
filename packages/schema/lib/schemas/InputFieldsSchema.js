'use strict';

const makeSchema = require('../utils/makeSchema');

const InputFieldSchema = require('./InputFieldSchema');

module.exports = makeSchema(
  {
    id: '/InputFieldsSchema',
    description: 'An array or collection of input fields.',
    type: 'array',
    items: { $ref: InputFieldSchema.id },
    examples: [[{ key: 'abc' }]],
    antiExamples: [{ example: {}, reason: 'Must be an array' }],
  },
  [InputFieldSchema],
);
