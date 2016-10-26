'use strict';

const makeSchema = require('../utils/makeSchema');

const RequestSchema = require('./RequestSchema');
const FunctionSchema = require('./FunctionSchema');

module.exports = makeSchema({
  id: '/AuthenticationSessionConfigSchema',
  description: 'Config for session authentication schema.',
  type: 'object',
  required: ['perform'],
  properties: {
    perform: {
      description: 'How will we get additional authData?',
      oneOf: [
        {$ref: RequestSchema.id},
        {$ref: FunctionSchema.id}
      ]
    }
  },
  additionalProperties: false
}, [
  FunctionSchema,
  RequestSchema
]);
