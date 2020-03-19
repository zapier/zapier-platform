'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicActionOperationSchema = require('./BasicActionOperationSchema');
const KeySchema = require('./KeySchema');

module.exports = makeSchema(
  {
    id: '/ReadSchema',
    description: 'How will Zapier fetch resources from your application?',
    type: 'object',
    required: ['key', 'noun', 'display', 'operation'],
    examples: [
      {
        key: 'recipes',
        noun: 'Recipes',
        display: {
          label: 'Recipes',
          description: 'A Read to let Zapier fetch recipes.'
        },
        operation: {
          perform: '$func$0$f$',
          sample: {
            id: 1,
            firstName: 'Walter',
            lastName: 'Sobchak',
            occupation: 'Bowler'
          }
        }
      }
    ],
    antiExamples: [
      {
        display: {
          label: 'Get Users',
          description: 'Retrieve an index of users.'
        },
        operation: {
          description: 'Define how this search method will work.'
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
        $ref: BasicActionOperationSchema.id
      }
    },
    additionalProperties: false
  },
  [KeySchema, BasicDisplaySchema, BasicActionOperationSchema]
);
