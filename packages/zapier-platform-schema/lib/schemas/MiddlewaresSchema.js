'use strict';

const makeSchema = require('../utils/makeSchema');
const FunctionSchema = require('./FunctionSchema');

module.exports = makeSchema({
  id: '/MiddlewaresSchema',
  description: 'List of HTTP before or after middlewares. Can be array of functions or single function',
  oneOf: [
    {
      type: 'array',
      items: {$ref: FunctionSchema.id}
    },
    {$ref: FunctionSchema.id}
  ],
  additionalProperties: false
});
