'use strict';

const makeSchema = require('../utils/makeSchema');
const { SKIP_KEY } = require('../constants');

const DynamicFieldsSchema = require('./DynamicFieldsSchema');
const FunctionSchema = require('./FunctionSchema');
const RequestSchema = require('./RequestSchema');
const ResultsSchema = require('./ResultsSchema');
const KeySchema = require('./KeySchema');

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
          '**INTERNAL USE ONLY**. Zapier uses this config for internal operation locking.',
        type: 'object',
        required: ['key'],
        properties: {
          key: {
            description:
              'The key to use for locking. This should be unique to the operation.',
            $ref: KeySchema.id,
          },
          scope: {
            description:
              'The scope can be configured to lock on a per-user basis. If one is not provided, then the default scope "app" is used which means only the "key" is used. "user" scope ensures all requests for the same user is made one at a time. "auth" scope ensures all requests for the same authenticated user is made one at a time. "account" scope ensures all accounts across Zapier can make requests one at a time. You may also combine scopes.',
            type: 'array',
            items: {
              enum: ['user', 'auth', 'account'],
              type: 'string',
            },
          },
          timeout: {
            description:
              'The number of seconds to hold the lock before timing out. If not provided, will use the default set by the app.',
            type: 'integer',
          },
        },
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
  [DynamicFieldsSchema, FunctionSchema, KeySchema, RequestSchema, ResultsSchema]
);
