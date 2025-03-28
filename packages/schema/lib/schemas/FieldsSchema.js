'use strict';

const makeSchema = require('../utils/makeSchema');

const FieldSchema = require('./FieldSchema');

module.exports = makeSchema(
  {
    id: '/FieldsSchema',
    description: 'An array or collection of fields.',
    type: 'array',
    items: { $ref: FieldSchema.id },
    examples: [[{ key: 'abc' }]],
    antiExamples: [{ example: {}, reason: 'Must be an array' }],
  },
  [FieldSchema],
);
