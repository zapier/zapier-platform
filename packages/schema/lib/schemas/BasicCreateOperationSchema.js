'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicActionOperationSchema = require('./BasicActionOperationSchema');
const BufferConfigSchema = require('./BufferConfigSchema');
const FunctionSchema = require('./FunctionSchema');
const RequestSchema = require('./RequestSchema');

// TODO: would be nice to deep merge these instead
// or maybe use allOf which is built into json-schema
const BasicCreateOperationSchema = JSON.parse(
  JSON.stringify(BasicActionOperationSchema.schema),
);

BasicCreateOperationSchema.id = '/BasicCreateOperationSchema';
BasicCreateOperationSchema.description =
  'Represents the fundamental mechanics of a create.';

BasicCreateOperationSchema.properties.perform = {
  description:
    "How will Zapier get the data? This can be a function like `(z) => [{id: 123}]` or a request like `{url: 'http...'}`. Exactly one of `perform` or `performBuffer` must be defined. If you choose to define `buffer` and `performBuffer`, you must omit `perform`.",
  oneOf: [{ $ref: RequestSchema.id }, { $ref: FunctionSchema.id }],
  docAnnotation: {
    required: {
      type: 'replace', // replace or append
      value: 'no (with exceptions, see description)',
    },
  },
};

BasicCreateOperationSchema.properties.buffer = {
  description:
    'Currently an **internal-only** feature. Zapier uses this configuration for creating objects in bulk with `performBuffer`.',
  $ref: BufferConfigSchema.id,
  docAnnotation: {
    required: {
      type: 'replace', // replace or append
      value: 'no (with exceptions, see description)',
    },
  },
};

BasicCreateOperationSchema.properties.performBuffer = {
  description:
    'Currently an **internal-only** feature. A function to create objects in bulk with. `buffer` and `performBuffer` must either both be defined or neither. Additionally, only one of `perform` or `performBuffer` can be defined. If you choose to define `perform`, you must omit `buffer` and `performBuffer`.',
  $ref: FunctionSchema.id,
  docAnnotation: {
    required: {
      type: 'replace', // replace or append
      value: 'no (with exceptions, see description)',
    },
  },
};

delete BasicCreateOperationSchema.required;

module.exports = makeSchema(
  BasicCreateOperationSchema,
  BasicActionOperationSchema.dependencies.concat(BufferConfigSchema),
);
