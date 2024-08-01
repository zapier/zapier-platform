'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicActionOperationSchema = require('./BasicActionOperationSchema');
const BulkObjectSchema = require('./BulkObjectSchema');
const FunctionSchema = require('./FunctionSchema');
const RequestSchema = require('./RequestSchema');

// TODO: would be nice to deep merge these instead
// or maybe use allOf which is built into json-schema
const BasicCreateActionOperationSchema = JSON.parse(
  JSON.stringify(BasicActionOperationSchema.schema)
);

BasicCreateActionOperationSchema.id = '/BasicCreateActionOperationSchema';
BasicCreateActionOperationSchema.description =
  'Represents the fundamental mechanics of a create.';

BasicCreateActionOperationSchema.properties.shouldLock = {
  description:
    'Should this action be performed one at a time (avoid concurrency)?',
  type: 'boolean',
};

BasicCreateActionOperationSchema.properties.perform = {
  description:
    "How will Zapier get the data? This can be a function like `(z) => [{id: 123}]` or a request like `{url: 'http...'}`. Exactly one of `perform` or `performBulk` must be defined. If you choose to define `bulk` and `performBulk`, you must omit `perform`.",
  oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }],
  docAnnotation: {
    required: {
      type: 'replace', // replace or append
      value: 'no (with exceptions, see description)',
    },
  },
};

BasicCreateActionOperationSchema.properties.bulk = {
  description:
    'Zapier uses this configuration for writing in bulk with `performBulk`.',
  $ref: BulkObjectSchema.id,
  docAnnotation: {
    required: {
      type: 'replace', // replace or append
      value: 'no (with exceptions, see description)',
    },
  },
};

BasicCreateActionOperationSchema.properties.performBulk = {
  description:
    'A function to write in bulk with. `bulk` and `performBulk` must either both be defined or neither. Additionally, only one of `perform` or `performBulk` can be defined. If you choose to define `perform`, you must omit `bulk` and `performBulk`.',
  $ref: FunctionSchema.id,
  docAnnotation: {
    required: {
      type: 'replace', // replace or append
      value: 'no (with exceptions, see description)',
    },
  },
};

delete BasicCreateActionOperationSchema.required;

module.exports = makeSchema(
  BasicCreateActionOperationSchema,
  BasicActionOperationSchema.dependencies.concat(BulkObjectSchema)
);
