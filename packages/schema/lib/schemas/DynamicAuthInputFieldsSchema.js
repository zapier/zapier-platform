'use strict';

const makeSchema = require('../utils/makeSchema');

const AuthInputFieldSchema = require('./AuthInputFieldSchema');

module.exports = makeSchema(
  {
    id: '/DynamicAuthInputFieldsSchema',
    description: 'An array or collection of auth input fields.',
    type: 'array',
    items: {
      oneOf: [{ $ref: AuthInputFieldSchema.id }],
    },
    examples: [[{ key: 'abc' }]],
    antiExamples: [{ example: {}, reason: 'Must be an array' }],
  },
  [AuthInputFieldSchema],
);
