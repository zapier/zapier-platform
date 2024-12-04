'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicActionOperationSchema = require('./BasicActionOperationSchema');
const KeySchema = require('./KeySchema');

module.exports = makeSchema(
  {
    id: '/BulkReadSchema',
    description: 'How will Zapier fetch resources from your application?',
    type: 'object',
    required: ['key', 'noun', 'display', 'operation'],
    properties: {
      key: {
        description: 'A key to uniquely identify a record.',
        $ref: KeySchema.id,
      },
      noun: {
        description:
          'A noun for this read that completes the sentence "reads all of the XXX".',
        type: 'string',
        minLength: 2,
        maxLength: 255,
      },
      display: {
        description: 'Configures the UI for this read bulk.',
        $ref: BasicDisplaySchema.id,
      },
      operation: {
        description: 'Powers the functionality for this read bulk.',
        $ref: BasicActionOperationSchema.id,
      },
    },
    examples: [
      {
        key: 'recipes',
        noun: 'Recipes',
        display: {
          label: 'Recipes',
          description: 'A Read that lets Zapier fetch all recipes.',
        },
        operation: {
          perform: '$func$0$f$',
          sample: {
            id: 1,
            firstName: 'Walter',
            lastName: 'Sobchak',
            occupation: 'Bowler',
          },
        },
      },
    ],
    antiExamples: [
      {
        example: {
          display: {
            label: 'Get User',
            description: 'Retrieve a user.',
          },
          operation: {
            description: 'Define how this search method will work.',
          },
        },
        reason: 'Missing required keys: key and noun',
      },
    ],
    additionalProperties: false,
  },
  [KeySchema, BasicDisplaySchema, BasicActionOperationSchema],
);
