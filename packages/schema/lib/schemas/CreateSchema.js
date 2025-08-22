'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicCreateOperationSchema = require('./BasicCreateOperationSchema');
const KeySchema = require('./KeySchema');

module.exports = makeSchema(
  {
    id: '/CreateSchema',
    description: 'How will Zapier create a new object?',
    type: 'object',
    required: ['key', 'type', 'noun', 'display', 'operation'],
    properties: {
      key: {
        description: 'A key to uniquely identify this create.',
        $ref: KeySchema.id,
      },
      type: {
        description: 'Identifies this as a create action.',
        type: 'string',
        enum: ['create'],
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
        $ref: BasicCreateOperationSchema.id,
      },
    },
    examples: [
      {
        key: 'recipe',
        type: 'create',
        noun: 'Recipe',
        display: {
          label: 'Create Recipe',
          description: 'Creates a new recipe.',
        },
        operation: { perform: '$func$2$f$', sample: { id: 1 } },
      },
      {
        key: 'recipe',
        type: 'create',
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
          operation: {
            perform: '$func$2$f$',
          },
        },
        reason:
          'Missing required key on operation: sample. Note - this is valid if the resource has defined a sample.',
      },
      {
        example: {
          key: 'recipe',
          noun: 'Recipe',
          display: {
            label: 'Create Recipe',
            description: 'Creates a new recipe.',
          },
          operation: { perform: '$func$2$f$', sample: { id: 1 } },
        },
        reason: 'Missing required key: type',
      },
      {
        example: {
          key: 'recipe',
          type: 'search',
          noun: 'Recipe',
          display: {
            label: 'Create Recipe',
            description: 'Creates a new recipe.',
          },
          operation: { perform: '$func$2$f$', sample: { id: 1 } },
        },
        reason: 'Invalid type value - must be "create"',
      },
    ],
    additionalProperties: false,
  },
  [BasicDisplaySchema, BasicCreateOperationSchema, KeySchema],
);
