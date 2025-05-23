'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicSearchOperationSchema = require('./BasicSearchOperationSchema');
const KeySchema = require('./KeySchema');

module.exports = makeSchema(
  {
    id: '/SearchSchema',
    description: 'How will Zapier search for existing objects?',
    type: 'object',
    required: ['key', 'noun', 'display', 'operation'],
    properties: {
      key: {
        description: 'A key to uniquely identify this search.',
        $ref: KeySchema.id,
      },
      noun: {
        description:
          'A noun for this search that completes the sentence "finds a specific XXX".',
        type: 'string',
        minLength: 2,
        maxLength: 255,
      },
      display: {
        description: 'Configures the UI for this search.',
        $ref: BasicDisplaySchema.id,
      },
      operation: {
        description: 'Powers the functionality for this search.',
        $ref: BasicSearchOperationSchema.id,
      },
    },
    additionalProperties: false,
    examples: [
      {
        key: 'recipe',
        noun: 'Recipe',
        display: {
          label: 'Find a Recipe',
          description: 'Search for recipe by cuisine style.',
        },
        operation: {
          perform: '$func$2$f$',
          sample: { id: 1 },
        },
      },
      {
        key: 'recipe',
        noun: 'Recipe',
        display: {
          label: 'Find a Recipe',
          description: 'Search for recipe by cuisine style.',
          hidden: true,
        },
        operation: { perform: '$func$2$f$' },
      },
    ],
    antiExamples: [
      {
        example: 'abc',
        reason: 'Must be an object',
      },
      {
        example: {
          key: 'recipe',
          noun: 'Recipe',
          display: {
            label: 'Find a Recipe',
            description: 'Search for recipe by cuisine style.',
          },
          operation: {
            perform: '$func$2$f$',
          },
        },
        reason:
          'Missing required key in operation: sample. Note - this is valid if the associated resource has defined a sample.',
      },
    ],
  },
  [BasicDisplaySchema, BasicSearchOperationSchema, KeySchema],
);
