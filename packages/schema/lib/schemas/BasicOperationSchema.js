'use strict';

const makeSchema = require('../utils/makeSchema');

const DynamicFieldsSchema = require('./DynamicFieldsSchema');
const FunctionSchema = require('./FunctionSchema');
const RefResourceSchema = require('./RefResourceSchema');
const RequestSchema = require('./RequestSchema');
const ResultsSchema = require('./ResultsSchema');

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
        $ref: RefResourceSchema.id
      },
      perform: {
        description:
          "How will Zapier get the data? This can be a function like `(z) => [{id: 123}]` or a request like `{url: 'http...'}`.",
        oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }]
      },
      inputFields: {
        description:
          'What should the form a user sees and configures look like?',
        $ref: DynamicFieldsSchema.id
      },
      outputFields: {
        description:
          'What fields of data will this return? Will use resource outputFields if missing, will also use sample if available.',
        $ref: DynamicFieldsSchema.id
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
            value: '**yes** (with exceptions, see description)'
          }
        }
      }
    },
    additionalProperties: false
  },
  [
    DynamicFieldsSchema,
    FunctionSchema,
    RefResourceSchema,
    RequestSchema,
    ResultsSchema
  ]
);
