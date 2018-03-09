'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicActionOperationSchema = require('./BasicActionOperationSchema');

module.exports = makeSchema(
  {
    id: '/ResourceMethodCreateSchema',
    description:
      'How will we find create a specific object given inputs? Will be turned into a create automatically.',
    type: 'object',
    required: ['display', 'operation'],
    examples: [
      {
        display: {
          label: 'Create Tag',
          description: 'Create a new Tag in your account.'
        },
        operation: {
          perform: '$func$2$f$',
          sample: {
            id: 1
          }
        }
      },
      {
        display: {
          label: 'Create Tag',
          description: 'Create a new Tag in your account.',
          hidden: true
        },
        operation: {
          perform: '$func$2$f$'
        }
      }
    ],
    antiExamples: [
      {
        display: {
          label: 'Create Tag',
          description: 'Create a new Tag in your account.'
        },
        operation: {
          perform: '$func$2$f$'
        }
      }
    ],
    properties: {
      display: {
        description: 'Define how this create method will be exposed in the UI.',
        $ref: BasicDisplaySchema.id
      },
      operation: {
        description: 'Define how this create method will work.',
        $ref: BasicActionOperationSchema.id
      }
    },
    additionalProperties: false
  },
  [BasicDisplaySchema, BasicActionOperationSchema]
);
