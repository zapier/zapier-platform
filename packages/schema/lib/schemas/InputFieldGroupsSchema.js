'use strict';

const makeSchema = require('../utils/makeSchema');

const KeySchema = require('./KeySchema');

module.exports = makeSchema(
  {
    id: '/InputFieldGroupsSchema',
    description: 'An array or collection of input field groups.',
    type: 'array',
    items: {
      type: 'object',
      required: ['key'],
      properties: {
        key: {
          description: 'The unique identifier for this group.',
          $ref: KeySchema.id,
        },
        label: {
          description: 'The human-readable name for the group.',
          type: 'string',
          minLength: 1,
        },
        emphasize: {
          description:
            'Whether this group should be visually emphasized in the UI.',
          type: 'boolean',
        },
      },
    },
    examples: [[{ key: 'abc' }]],
    antiExamples: [
      { example: {}, reason: 'Must be an array' },
      { example: [{ label: 'test label' }], reason: 'key is required' },
    ],
    additionalProperties: false,
  },
  [KeySchema],
);
