'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicPollingOperationSchema = require('./BasicPollingOperationSchema');

module.exports = makeSchema(
  {
    id: '/ResourceMethodListSchema',
    description:
      'How will we get a list of new objects? Will be turned into a trigger automatically.',
    type: 'object',
    required: ['display', 'operation'],
    examples: [
      {
        display: {
          label: 'New User',
          description: 'Trigger when a new User is created in your account.',
        },
        operation: {
          perform: {
            url: 'https://fake-crm.getsandbox.com/users',
          },
          sample: {
            id: 49,
            name: 'Veronica Kuhn',
            email: 'veronica.kuhn@company.com',
          },
        },
      },
      {
        display: {
          label: 'New User',
          description: 'Trigger when a new User is created in your account.',
          hidden: true,
        },
        operation: {
          perform: {
            url: 'https://fake-crm.getsandbox.com/users',
          },
        },
      },
    ],
    antiExamples: [
      {
        display: {
          label: 'New User',
          description: 'Trigger when a new User is created in your account.',
        },
        operation: {
          perform: {
            url: 'https://fake-crm.getsandbox.com/users',
          },
          // missing sample
        },
      },
    ],
    properties: {
      display: {
        description:
          'Define how this list/trigger method will be exposed in the UI.',
        $ref: BasicDisplaySchema.id,
      },
      operation: {
        description: 'Define how this list/trigger method will work.',
        $ref: BasicPollingOperationSchema.id,
      },
    },
    additionalProperties: false,
  },
  [BasicDisplaySchema, BasicPollingOperationSchema]
);
