'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicActionOperationSchema = require('./BasicActionOperationSchema');
const KeySchema = require('./KeySchema');

module.exports = makeSchema(
  {
    id: '/SearchSchema',
    description: 'How will Zapier search for existing objects?',
    type: 'object',
    required: ['key', 'noun', 'display', 'operation'],
    examples: [
      {
        key: 'recipe',
        noun: 'Recipe',
        display: {
          label: 'Find a Recipe',
          description: 'Search for recipe by cuisine style.'
        },
        operation: {
          perform: '$func$2$f$',
          sample: { id: 1 }
        }
      },
      {
        key: 'recipe',
        noun: 'Recipe',
        display: {
          label: 'Find a Recipe',
          description: 'Search for recipe by cuisine style.',
          hidden: true
        },
        operation: { perform: '$func$2$f$' }
      }
    ],
    antiExamples: [
      'abc',
      {
        key: 'recipe',
        noun: 'Recipe',
        display: {
          label: 'Find a Recipe',
          description: 'Search for recipe by cuisine style.'
        },
        operation: {
          perform: '$func$2$f$'
          // missing sample
        }
      }
    ],
    properties: {
      key: {
        description: 'A key to uniquely identify this search.',
        $ref: KeySchema.id
      },
      noun: {
        description:
          'A noun for this search that completes the sentence "finds a specific XXX".',
        type: 'string',
        minLength: 2,
        maxLength: 255
      },
      display: {
        description: 'Configures the UI for this search.',
        $ref: BasicDisplaySchema.id
      },
      operation: {
        description: 'Powers the functionality for this search.',
        $ref: BasicActionOperationSchema.id
      }
    },
    additionalProperties: false
  },
  [BasicDisplaySchema, BasicActionOperationSchema, KeySchema]
);
