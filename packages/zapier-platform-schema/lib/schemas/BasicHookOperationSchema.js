'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicOperationSchema = require('./BasicOperationSchema');
const FunctionSchema = require('./FunctionSchema');
const RequestSchema = require('./RequestSchema');

// TODO: would be nice to deep merge these instead
// or maybe use allOf which is built into json-schema
const BasicHookOperationSchema = JSON.parse(JSON.stringify(BasicOperationSchema.schema));

BasicHookOperationSchema.id = '/BasicHookOperationSchema';

BasicHookOperationSchema.description = 'Represents the inbound mechanics of hooks with optional subscribe/unsubscribe. Defers to list for fields.';

BasicHookOperationSchema.properties = {
  type: {
     // TODO: not a fan of this...
    description: 'Clarify how this operation works (polling == pull or hook == push).',
    type: 'string',
    'default': 'hook',
    enum: ['hook']
  },
  resource: BasicHookOperationSchema.properties.resource,
  perform: {
    description: 'How will we get the data from an inbound request?',
    $ref: FunctionSchema.id
  },
  performSubscribe: {
    description: 'Takes a URL and any necessary data from the user and subscribes.',
    oneOf: [
      {$ref: RequestSchema.id},
      {$ref: FunctionSchema.id},
    ]
  },
  performUnsubscribe: {
    description: 'Takes a URL and data from a previous subscribe call and unsubscribes.',
    oneOf: [
      {$ref: RequestSchema.id},
      {$ref: FunctionSchema.id},
    ]
  },
  inputFields: BasicHookOperationSchema.properties.inputFields,
  outputFields: BasicHookOperationSchema.properties.outputFields,
  sample: BasicHookOperationSchema.properties.sample,
};

module.exports = makeSchema(BasicHookOperationSchema, BasicOperationSchema.dependencies);
