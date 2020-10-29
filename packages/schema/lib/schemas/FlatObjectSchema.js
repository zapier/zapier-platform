'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/FlatObjectSchema',
  description: 'An object whose values can only be primitives',
  type: 'object',
  patternProperties: {
    '[^\\s]+': {
      description:
        'Any key may exist in this flat object as long as its values are simple.',
      anyOf: [
        { type: 'null' },
        { type: 'string' },
        { type: 'integer' },
        { type: 'number' },
        { type: 'boolean' },
      ],
    },
  },
  examples: [
    { a: 1, b: 2, c: 3 },
    { a: 1.2, b: 2.2, c: 3.3 },
    { a: 'a', b: 'b', c: 'c' },
    { a: true, b: true, c: false },
    { a: 'a', b: 2, c: 3.1, d: true, e: false },
    { 123: 'hello' },
  ],
  antiExamples: [
    {
      example: { a: {}, b: 2 },
      reason: 'Invalid value for key: a (objects are not allowed)',
    },
    {
      example: { a: [], b: 2 },
      reason: 'Invalid value for key: a (arrays are not allowed)',
    },
    {
      example: { '': 1 },
      reason: 'Key cannot be empty',
    },
  ],
  additionalProperties: false,
});
