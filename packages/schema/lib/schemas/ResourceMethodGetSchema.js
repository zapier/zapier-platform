'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicOperationSchema = require('./BasicOperationSchema');

module.exports = makeSchema(
  {
    id: '/ResourceMethodGetSchema',
    description:
      'How will we get a single object given a unique identifier/id?',
    type: 'object',
    required: ['display', 'operation'],
    properties: {
      display: {
        description: 'Define how this get method will be exposed in the UI.',
        $ref: BasicDisplaySchema.id,
      },
      operation: {
        description: 'Define how this get method will work.',
        $ref: BasicOperationSchema.id,
      },
    },
    additionalProperties: false,
    examples: [
      {
        display: {
          label: 'Get Tag by ID',
          description: 'Grab a specific Tag by ID.',
        },
        operation: {
          perform: {
            url: '$func$0$f$',
          },
          sample: {
            id: 385,
            name: 'proactive enable ROI',
          },
        },
      },
      {
        display: {
          label: 'Get Tag by ID',
          description: 'Grab a specific Tag by ID.',
          hidden: true,
        },
        operation: {
          perform: {
            url: '$func$0$f$',
          },
        },
      },
    ],
    antiExamples: [
      {
        example: {
          display: {
            label: 'Get Tag by ID',
            description: 'Grab a specific Tag by ID.',
          },
          operation: {
            perform: {
              url: '$func$0$f$',
            },
          },
        },
        reason:
          'Missing key from operation: sample. Note – this is valid if the resource has defined a sample.',
      },
    ],
  },
  [BasicDisplaySchema, BasicOperationSchema],
);
