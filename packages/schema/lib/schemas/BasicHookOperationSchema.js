'use strict';

const makeSchema = require('../utils/makeSchema');
const { SKIP_KEY } = require('../constants');

const BasicOperationSchema = require('./BasicOperationSchema');
const FunctionSchema = require('./FunctionSchema');
const RequestSchema = require('./RequestSchema');

// TODO: would be nice to deep merge these instead
// or maybe use allOf which is built into json-schema
const BasicHookOperationSchema = JSON.parse(
  JSON.stringify(BasicOperationSchema.schema),
);

const hookTechnicallyRequired =
  'Note: this is required for public apps to ensure the best UX for the end-user. For private apps, this is strongly recommended for testing REST Hooks. Otherwise, you can ignore warnings about this property with the `--without-style` flag during `zapier push`.';

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
        value: '**yes** (with exceptions, see description)',
      },
    },
  },
  resource: BasicHookOperationSchema.properties.resource,
  perform: {
    description: 'A function that processes the inbound webhook request.',
    $ref: FunctionSchema.id,
  },
  performList: {
    description:
      'Fetch a list of items on demand during testing instead of waiting for a hook. You can also consider resources and their built-in hook/list methods. ' +
      hookTechnicallyRequired,
    oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }],
    docAnnotation: {
      required: {
        type: 'replace',
        value: '**yes** (with exceptions, see description)',
      },
    },
  },
  canPaginate: {
    description:
      'Does this endpoint support pagination via temporary cursor storage?',
    type: 'boolean',
  },
  performSubscribe: {
    description:
      'Takes a URL and any necessary data from the user and subscribes. ' +
      hookTechnicallyRequired,
    oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }],
    docAnnotation: {
      required: {
        type: 'replace',
        value: '**yes** (with exceptions, see description)',
      },
    },
  },
  performUnsubscribe: {
    description:
      'Takes a URL and data from a previous subscribe call and unsubscribes. ' +
      hookTechnicallyRequired,
    oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }],
    docAnnotation: {
      required: {
        type: 'replace',
        value: '**yes** (with exceptions, see description)',
      },
    },
  },
  inputFields: BasicHookOperationSchema.properties.inputFields,
  outputFields: BasicHookOperationSchema.properties.outputFields,
  sample: BasicHookOperationSchema.properties.sample,
};

BasicHookOperationSchema.examples = [
  {
    type: 'hook',
    perform: { require: 'some/path/to/file.js' },
    performList: { require: 'some/path/to/file2.js' },
    performSubscribe: { require: 'some/path/to/file3.js' },
    performUnsubscribe: { require: 'some/path/to/file4.js' },
    sample: { id: 42, name: 'Hooli' },
  },
];

BasicHookOperationSchema.antiExamples = [
  {
    [SKIP_KEY]: true, // Cannot validate that sample is only required if display isn't true / top-level resource doesn't have sample
    example: {
      type: 'hook',
      perform: { require: 'some/path/to/file.js' },
      performList: { require: 'some/path/to/file2.js' },
      performSubscribe: { require: 'some/path/to/file3.js' },
      performUnsubscribe: { require: 'some/path/to/file4.js' },
    },
    reason:
      'Missing required key: sample. Note - This is only invalid if `display` is not explicitly set to true and if it does not belong to a resource that has a sample.',
  },
];

module.exports = makeSchema(
  BasicHookOperationSchema,
  BasicOperationSchema.dependencies,
);
