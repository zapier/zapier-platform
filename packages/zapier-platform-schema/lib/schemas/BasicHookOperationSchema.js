'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicOperationSchema = require('./BasicOperationSchema');
const FunctionSchema = require('./FunctionSchema');
const RequestSchema = require('./RequestSchema');

// TODO: would be nice to deep merge these instead
// or maybe use allOf which is built into json-schema
const BasicHookOperationSchema = JSON.parse(
  JSON.stringify(BasicOperationSchema.schema)
);

BasicHookOperationSchema.id = '/BasicHookOperationSchema';

BasicHookOperationSchema.description =
  'Represents the inbound mechanics of hooks with optional subscribe/unsubscribe. Defers to list for fields.';

BasicHookOperationSchema.properties = {
  type: {
    description:
      'Must be explicitly set to `"hook"` unless this hook is defined as part of a resource, in which case it\'s optional.',
    type: 'string',
    enum: ['hook'],
    docAnnotation: {
      required: {
        type: 'replace',
        value: '**yes** (with exceptions, see description)'
      }
    }
  },
  resource: BasicHookOperationSchema.properties.resource,
  perform: {
    description: 'A function that processes the inbound webhook request.',
    $ref: FunctionSchema.id
  },
  performList: {
    description:
      'Can get "live" data on demand instead of waiting for a hook. If you find yourself reaching for this - consider resources and their built-in hook/list methods.',
    oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }]
  },
  performSubscribe: {
    description:
      'Takes a URL and any necessary data from the user and subscribes.',
    oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }]
  },
  performUnsubscribe: {
    description:
      'Takes a URL and data from a previous subscribe call and unsubscribes.',
    oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }]
  },
  inputFields: BasicHookOperationSchema.properties.inputFields,
  outputFields: BasicHookOperationSchema.properties.outputFields,
  sample: BasicHookOperationSchema.properties.sample
};

module.exports = makeSchema(
  BasicHookOperationSchema,
  BasicOperationSchema.dependencies
);
