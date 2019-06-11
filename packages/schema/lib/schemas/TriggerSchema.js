'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicHookOperationSchema = require('./BasicHookOperationSchema');
const BasicPollingOperationSchema = require('./BasicPollingOperationSchema');
const KeySchema = require('./KeySchema');

module.exports = makeSchema(
  {
    id: '/TriggerSchema',
    description: 'How will Zapier get notified of new objects?',
    type: 'object',
    required: ['key', 'noun', 'display', 'operation'],
    examples: [
      {
        key: 'new_recipe',
        noun: 'Recipe',
        display: {
          label: 'New Recipe',
          description: 'Triggers when a new recipe is added.'
        },
        operation: {
          type: 'polling',
          perform: '$func$0$f$',
          sample: { id: 1 }
        }
      },
      {
        key: 'new_recipe',
        noun: 'Recipe',
        display: {
          label: 'New Recipe',
          description: 'Triggers when a new recipe is added.',
          hidden: true
        },
        operation: {
          type: 'polling',
          perform: '$func$0$f$'
        }
      }
    ],
    antiExamples: [
      {
        key: 'new_recipe',
        noun: 'Recipe',
        display: {
          label: 'New Recipe',
          description: 'Triggers when a new recipe is added.'
        },
        operation: {
          perform: '$func$0$f$'
        }
      }
    ],
    properties: {
      key: {
        description: 'A key to uniquely identify this trigger.',
        $ref: KeySchema.id
      },
      noun: {
        description:
          'A noun for this trigger that completes the sentence "triggers on a new XXX".',
        type: 'string',
        minLength: 2,
        maxLength: 255
      },
      display: {
        description: 'Configures the UI for this trigger.',
        $ref: BasicDisplaySchema.id
      },
      operation: {
        description: 'Powers the functionality for this trigger.',
        anyOf: [
          { $ref: BasicPollingOperationSchema.id },
          { $ref: BasicHookOperationSchema.id }
        ]
      }
    },
    additionalProperties: false
  },
  [
    KeySchema,
    BasicDisplaySchema,
    BasicPollingOperationSchema,
    BasicHookOperationSchema
  ]
);
