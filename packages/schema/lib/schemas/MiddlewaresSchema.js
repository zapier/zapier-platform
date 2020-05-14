'use strict';

const makeSchema = require('../utils/makeSchema');
const FunctionSchema = require('./FunctionSchema');

module.exports = makeSchema({
  id: '/MiddlewaresSchema',
  description:
    'List of before or after middlewares. Can be an array of functions or a single function',
  oneOf: [
    {
      type: 'array',
      items: { $ref: FunctionSchema.id },
    },
    { $ref: FunctionSchema.id },
  ],
  additionalProperties: false,
});
