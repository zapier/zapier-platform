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
    examples: [
      {
        display: {
          label: 'Get Tag by ID',
          description: 'Grab a specific Tag by ID.'
        },
        operation: {
          type: 'hook',
          perform: '$func$0$f$',
          sample: {
            id: 385,
            name: 'proactive enable ROI'
          }
        }
      },
      {
        display: {
          label: 'Get Tag by ID',
          description: 'Grab a specific Tag by ID.',
          hidden: true
        },
        operation: {
          type: 'hook',
          perform: '$func$0$f$'
        }
      }
    ],
    antiExamples: [
      {
        display: {
          label: 'Get Tag by ID',
          description: 'Grab a specific Tag by ID.'
        },
        operation: {
          type: 'hook',
          perform: '$func$0$f$'
        }
      }
    ],
    properties: {
      display: {
        description:
          'Define how this hook/trigger method will be exposed in the UI.',
        $ref: BasicDisplaySchema.id
      },
      operation: {
        description: 'Define how this hook/trigger method will work.',
        $ref: BasicHookOperationSchema.id
      }
    },
    additionalProperties: false
  },
  [BasicDisplaySchema, BasicHookOperationSchema]
);
