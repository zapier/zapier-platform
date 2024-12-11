'use strict';

const makeSchema = require('../utils/makeSchema');
const { SKIP_KEY } = require('../constants');

const DynamicFieldsSchema = require('./DynamicFieldsSchema');
const FunctionSchema = require('./FunctionSchema');
const RequestSchema = require('./RequestSchema');
const ResultsSchema = require('./ResultsSchema');
const KeySchema = require('./KeySchema');
const LockObjectSchema = require('./LockObjectSchema');
const ThrottleObjectSchema = require('./ThrottleObjectSchema');

module.exports = makeSchema(
  {
    id: '/BasicOperationSchema',
    description:
      'Represents the fundamental mechanics of triggers, searches, or creates.',
    type: 'object',
    required: ['perform'],
    properties: {
      resource: {
        description:
          'Optionally reference and extends a resource. Allows Zapier to automatically tie together samples, lists and hooks, greatly improving the UX. EG: if you had another trigger reusing a resource but filtering the results.',
        $ref: KeySchema.id,
      },
      perform: {
        description:
          "How will Zapier get the data? This can be a function like `(z) => [{id: 123}]` or a request like `{url: 'http...'}`.",
        oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }],
      },
      inputFields: {
        description:
          'What should the form a user sees and configures look like?',
        $ref: DynamicFieldsSchema.id,
      },
      outputFields: {
        description:
          'What fields of data will this return? Will use resource outputFields if missing, will also use sample if available.',
        $ref: DynamicFieldsSchema.id,
      },
      sample: {
        description:
          'What does a sample of data look like? Will use resource sample if missing. Requirement waived if `display.hidden` is true or if this belongs to a resource that has a top-level sample',
        type: 'object',
        // TODO: require id, ID, Id property?
        minProperties: 1,
        docAnnotation: {
          required: {
            type: 'replace', // replace or append
            value: '**yes** (with exceptions, see description)',
          },
        },
      },
      lock: {
        description:
          '**INTERNAL USE ONLY**. Zapier uses this configuration for internal operation locking.',
        $ref: LockObjectSchema.id,
      },
      throttle: {
        description:
          'Zapier uses this configuration to apply throttling when the limit for the window is exceeded.',
        $ref: ThrottleObjectSchema.id,
      },
    },
    examples: [
      {
        perform: { require: 'some/path/to/file.js' },
        sample: { id: 42, name: 'Hooli' },
      },
    ],
    antiExamples: [
      {
        [SKIP_KEY]: true, // Cannot validate that sample is only required if display isn't true / top-level resource doesn't have sample
        example: {
          perform: { require: 'some/path/to/file.js' },
        },
        reason:
          'Missing required key: sample. Note - This is only invalid if `display` is not explicitly set to true and if it does not belong to a resource that has a sample.',
      },
    ],
    additionalProperties: false,
  },
  [
    DynamicFieldsSchema,
    FunctionSchema,
    KeySchema,
    LockObjectSchema,
    RequestSchema,
    ResultsSchema,
    ThrottleObjectSchema,
  ],
);
