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
      {
        example: 'abc',
        reason: 'Must be an object',
      },
      {
        example: {
          key: 'recipe',
          noun: 'Recipe',
          display: {
            label: 'Create Recipe',
            description: 'Creates a new recipe.',
          },
          operation: { perform: '$func$2$f$', shouldLock: 'yes' },
        },
        reason: 'Invalid value for key on operation: shouldLock',
      },
      {
        example: {
          key: 'recipe',
          noun: 'Recipe',
          display: {
            label: 'Create Recipe',
            description: 'Creates a new recipe.',
          },
          operation: {
            perform: '$func$2$f$',
          },
        },
        reason:
          'Missing required key on operation: sample. Note - this is valid if the resource has defined a sample.',
      },
    ],
    additionalProperties: false,
  },
  [BasicDisplaySchema, BasicCreateActionOperationSchema, KeySchema],
);
