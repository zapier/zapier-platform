'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/FlatObjectSchema',
  description: 'An object whose values can only be primitives',
  type: 'object',
  examples: [
    { a: 1, b: 2, c: 3 },
    { a: 1.2, b: 2.2, c: 3.3 },
    { a: 'a', b: 'b', c: 'c' },
    { a: true, b: true, c: false },
    { a: 'a', b: 2, c: 3.1, d: true, e: false },
    { 123: 'hello' }
  ],
  antiExamples: [
    { a: {}, b: 2 },
    { a: { aa: 1 }, b: 2 },
    { a: [], b: 2 },
    { a: [1, 2, 3], b: 2 },
    { '': 1 },
    { ' ': 1 },
    { '     ': 1 }
  ],
  patternProperties: {
    '[^\\s]+': {
      description:
        'Any key may exist in this flat object as long as its values are simple.',
      anyOf: [
        { type: 'null' },
        { type: 'string' },
        { type: 'integer' },
        { type: 'number' },
        { type: 'boolean' }
      ]
    }
  },
  additionalProperties: false
});
