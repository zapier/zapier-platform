'use strict';

const makeSchema = require('../utils/makeSchema');
const { SKIP_KEY } = require('../constants');

const BasicOperationSchema = require('./BasicOperationSchema');
const FunctionSchema = require('./FunctionSchema');
const RequestSchema = require('./RequestSchema');

// TODO: would be nice to deep merge these instead
// or maybe use allOf which is built into json-schema
const BasicActionOperationSchema = JSON.parse(
  JSON.stringify(BasicOperationSchema.schema),
);

BasicActionOperationSchema.id = '/BasicActionOperationSchema';
BasicActionOperationSchema.description =
  'Represents the fundamental mechanics of a search/create.';

BasicActionOperationSchema.properties = {
  resource: BasicActionOperationSchema.properties.resource,
  perform: BasicActionOperationSchema.properties.perform,
  performResume: {
    description:
      'A function that parses data from a perform (which uses z.generateCallbackUrl()) and callback request to resume this action.',
    $ref: FunctionSchema.id,
  },
  performGet: {
    description:
      'How will Zapier get a single record? If you find yourself reaching for this - consider resources and their built-in get methods.',
    oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }],
  },
  inputFields: BasicActionOperationSchema.properties.inputFields,
  outputFields: BasicActionOperationSchema.properties.outputFields,
  sample: BasicActionOperationSchema.properties.sample,
  lock: BasicActionOperationSchema.properties.lock,
  throttle: BasicActionOperationSchema.properties.throttle,
};

BasicActionOperationSchema.examples = [
  {
    perform: { require: 'some/path/to/file.js' },
    sample: { id: 42, name: 'Hooli' },
  },
];

BasicActionOperationSchema.antiExamples = [
  {
    [SKIP_KEY]: true, // Cannot validate that sample is only required if display isn't true / top-level resource doesn't have sample
    example: {
      perform: { require: 'some/path/to/file.js' },
    },
    reason:
      'Missing required key: sample. Note - This is only invalid if `display` is not explicitly set to true and if it does not belong to a resource that has a sample.',
  },
];

module.exports = makeSchema(
  BasicActionOperationSchema,
  BasicOperationSchema.dependencies,
);
