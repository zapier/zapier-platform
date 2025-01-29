'use strict';

const makeSchema = require('../utils/makeSchema');

const AuthFieldSchema = require('./AuthFieldSchema');

module.exports = makeSchema(
  {
    id: '/AuthFieldsSchema',
    description: 'An array or collection of auth input fields.',
    type: 'array',
    items: {
      oneOf: [{ $ref: AuthFieldSchema.id }],
    },
    examples: [[{ key: 'abc' }]],
    antiExamples: [{ example: {}, reason: 'Must be an array' }],
  },
  [AuthFieldSchema],
);
