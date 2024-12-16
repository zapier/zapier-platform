'use strict';

const makeSchema = require('../utils/makeSchema');
const { SKIP_KEY } = require('../constants');

const BasicOperationSchema = require('./BasicOperationSchema');
const FunctionSchema = require('./FunctionSchema');
const RequestSchema = require('./RequestSchema');

// TODO: would be nice to deep merge these instead
// or maybe use allOf which is built into json-schema
const BasicHookToPollOperationSchema = JSON.parse(
  JSON.stringify(BasicOperationSchema.schema),
);

BasicHookToPollOperationSchema.id = '/BasicHookToPollOperationSchema';

BasicHookToPollOperationSchema.description =
  'Represents the inbound mechanics of hook to poll style triggers. Defers to list for fields.';

BasicHookToPollOperationSchema.docAnnotation = {
  hide: true,
};

BasicHookToPollOperationSchema.required = [
  'performList',
  'performSubscribe',
  'performUnsubscribe',
];

BasicHookToPollOperationSchema.properties = {
  type: {
    description: 'Must be explicitly set to `"hook_to_poll"`.',
    type: 'string',
    enum: ['hook_to_poll'],
    required: {
      type: 'replace',
      value: '**yes** (with exceptions, see description)',
    },
  },
  performList: {
    description:
      'Similar a polling trigger, but checks for new data when a webhook is received, instead of every few minutes',
    oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }],
  },
  canPaginate: {
    description:
      'Does this endpoint support pagination via temporary cursor storage?',
    type: 'boolean',
  },
  performSubscribe: {
    description:
      'Takes a URL and any necessary data from the user and subscribes. ',
    oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }],
  },
  performUnsubscribe: {
    description:
      'Takes a URL and data from a previous subscribe call and unsubscribes. ',
    oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }],
  },
  inputFields: BasicHookToPollOperationSchema.properties.inputFields,
  outputFields: BasicHookToPollOperationSchema.properties.outputFields,
  sample: BasicHookToPollOperationSchema.properties.sample,
  maxPollingDelay: {
    description:
      'The maximum amount of time to wait between polling requests in seconds. Minimum value is 20s and will default to 20 if not set, or set to a lower value.',
    type: 'integer',
  },
};

BasicHookToPollOperationSchema.examples = [
  {
    type: 'hook_to_poll',
    performList: { require: 'some/path/to/file2.js' },
    performSubscribe: { require: 'some/path/to/file3.js' },
    performUnsubscribe: { require: 'some/path/to/file4.js' },
    sample: { id: 42, name: 'Hooli' },
  },
];

BasicHookToPollOperationSchema.antiExamples = [
  {
    [SKIP_KEY]: true, // Cannot validate that sample is only required if display isn't true
    example: {
      type: 'hook_to_poll',
      performList: { require: 'some/path/to/file2.js' },
      performSubscribe: { require: 'some/path/to/file3.js' },
      performUnsubscribe: { require: 'some/path/to/file4.js' },
    },
    reason:
      'Missing required key: sample. Note - This is only invalid if `display` is not explicitly set to true',
  },
];

module.exports = makeSchema(
  BasicHookToPollOperationSchema,
  BasicOperationSchema.dependencies,
);
