'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicCreateActionOperationSchema = require('./BasicCreateActionOperationSchema');
const KeySchema = require('./KeySchema');

module.exports = makeSchema(
  {
    id: '/CreateSchema',
    description: 'How will Zapier create a new object?',
    type: 'object',
    required: ['key', 'noun', 'display', 'operation'],
    examples: [
      {
        key: 'recipe',
        noun: 'Recipe',
        display: {
          label: 'Create Recipe',
          description: 'Creates a new recipe.',
        },
        operation: { perform: '$func$2$f$', sample: { id: 1 } },
      },
      {
        key: 'recipe',
        noun: 'Recipe',
        display: {
          label: 'Create Recipe',
          description: 'Creates a new recipe.',
        },
        operation: {
          perform: '$func$2$f$',
          sample: { id: 1 },
          shouldLock: true,
        },
      },
      {
        key: 'recipe',
        noun: 'Recipe',
        display: {
          label: 'Create Recipe',
          description: 'Creates a new recipe.',
          hidden: true,
        },
        operation: {
          perform: '$func$2$f$',
        },
      },
    ],
    antiExamples: [
      'abc',
      {
        key: 'recipe',
        noun: 'Recipe',
        display: {
          label: 'Create Recipe',
          description: 'Creates a new recipe.',
        },
        operation: { perform: '$func$2$f$', shouldLock: 'yes' },
      },
      {
        key: 'recipe',
        noun: 'Recipe',
        display: {
          label: 'Create Recipe',
          description: 'Creates a new recipe.',
        },
        operation: {
          perform: '$func$2$f$',
          // sample is missing!
        },
      },
    ],
    properties: {
      key: {
        description: 'A key to uniquely identify this create.',
        $ref: KeySchema.id,
      },
      noun: {
        description:
          'A noun for this create that completes the sentence "creates a new XXX".',
        type: 'string',
        minLength: 2,
        maxLength: 255,
      },
      display: {
        description: 'Configures the UI for this create.',
        $ref: BasicDisplaySchema.id,
      },
      operation: {
        description: 'Powers the functionality for this create.',
        $ref: BasicCreateActionOperationSchema.id,
      },
    },
    additionalProperties: false,
  },
  [BasicDisplaySchema, BasicCreateActionOperationSchema, KeySchema]
);
