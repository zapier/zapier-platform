'use strict';

const makeSchema = require('../utils/makeSchema');

const InputFieldGroupSchema = require('./InputFieldGroupSchema');

module.exports = makeSchema(
  {
    id: '/InputFieldGroupsSchema',
    description: 'An array or collection of input field groups.',
    type: 'array',
    items: {
      $ref: InputFieldGroupSchema.id,
    },
    examples: [[{ key: 'abc' }]],
    antiExamples: [
      { example: {}, reason: 'Must be an array' },
      { example: [{ label: 'test label' }], reason: 'key is required' },
    ],
    additionalProperties: false,
  },
  [InputFieldGroupSchema],
);
