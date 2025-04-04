'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicHookOperationSchema = require('./BasicHookOperationSchema');

module.exports = makeSchema(
  {
    id: '/ResourceMethodHookSchema',
    description:
      'How will we get notified of new objects? Will be turned into a trigger automatically.',
    type: 'object',
    required: ['display', 'operation'],
    properties: {
      display: {
        description:
          'Define how this hook/trigger method will be exposed in the UI.',
        $ref: BasicDisplaySchema.id,
      },
      operation: {
        description: 'Define how this hook/trigger method will work.',
        $ref: BasicHookOperationSchema.id,
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
          type: 'hook',
          perform: '$func$0$f$',
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
          type: 'hook',
          perform: '$func$0$f$',
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
            type: 'hook',
            perform: '$func$0$f$',
          },
        },
        reason:
          'Missing key from operation: sample. Note – this is valid if the resource has defined a sample.',
      },
    ],
  },
  [BasicDisplaySchema, BasicHookOperationSchema],
);
