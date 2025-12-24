'use strict';

const makeSchema = require('../utils/makeSchema');

const FunctionSchema = require('./FunctionSchema');
const RequestSchema = require('./RequestSchema');

module.exports = makeSchema(
  {
    id: '/FieldDynamicChoicesSchema',
    description:
      'Describes dynamic dropdowns powered by a perform function or request.',
    type: 'object',
    required: ['perform'],
    properties: {
      perform: {
        description:
          'A function or request that returns choices for this dynamic dropdown.',
        oneOf: [{ $ref: FunctionSchema.id }, { $ref: RequestSchema.id }],
      },
    },
    additionalProperties: false,
    examples: [
      { perform: '$func$0$f$' },
      { perform: { source: 'return []' } },
      {
        perform: {
          method: 'GET',
          url: 'https://api.example.com/choices',
        },
      },
    ],
    antiExamples: [
      {
        example: {},
        reason: 'Missing required key: perform',
      },
      {
        example: { someKey: 'value' },
        reason: 'Missing required key: perform',
      },
      {
        example: { perform: 'invalid' },
        reason:
          'Invalid value for key: perform (must be a function or request)',
      },
      {
        example: { perform: '$func$0$f$', unknownKey: 'value' },
        reason: 'Invalid extra property: unknownKey',
      },
    ],
  },
  [FunctionSchema, RequestSchema],
);
