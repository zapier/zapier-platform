'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicActionOperationSchema = require('./BasicActionOperationSchema');

module.exports = makeSchema(
  {
    id: '/ResourcesMethodGetSchema',
    description: 'How will we get a batch of objects?',
    type: 'objects',
    required: ['display', 'operation'],
    examples: [
      {
        display: {
          label: 'Get Users',
          description: 'Retrieve an index of users.',
        },
        operation: {
          display: 'Fetch users',
          perform: '$func$2$f$',
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
        display: {
          label: 'Get Users',
          description: 'Retrieve an index of users.',
        },
        operation: {
          description: 'Define how this search method will work.',
          $ref: BasicActionOperationSchema.id,
        },
      },
    ],
    properties: {
      display: {
        description: 'Define how this get method will be exposed in the UI.',
        $ref: BasicDisplaySchema.id,
      },
      operation: {
        description: 'Define how this get method will work.',
        $ref: BasicActionOperationSchema.id,
      },
    },
    additionalProperties: false,
  },
  [BasicDisplaySchema, BasicActionOperationSchema],
);
