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
        oneOf: [{ $ref: FunctionSchema.id }, { $ref: RequestSchema.id }],
      },
    },
    additionalProperties: false,
  },
  [FunctionSchema, RequestSchema],
);
