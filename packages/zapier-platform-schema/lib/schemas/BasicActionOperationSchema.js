'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicOperationSchema = require('./BasicOperationSchema');
const FunctionSchema = require('./FunctionSchema');
const RequestSchema = require('./RequestSchema');

// TODO: would be nice to deep merge these instead
// or maybe use allOf which is built into json-schema
const BasicActionOperationSchema = JSON.parse(JSON.stringify(BasicOperationSchema.schema));

BasicActionOperationSchema.id = '/BasicActionOperationSchema';

BasicActionOperationSchema.properties = {
  resource: BasicActionOperationSchema.properties.resource,
  perform: BasicActionOperationSchema.properties.perform,
  performGet: {
    description: 'How will we get a single bit of rich data? If you find yourself reaching for this - consider resources and their built-in get methods.',
    oneOf: [
      {$ref: RequestSchema.id},
      {$ref: FunctionSchema.id}
    ]
  },
  inputFields: BasicActionOperationSchema.properties.inputFields,
  outputFields: BasicActionOperationSchema.properties.outputFields,
  sample: BasicActionOperationSchema.properties.sample,
};

module.exports = makeSchema(BasicActionOperationSchema, BasicOperationSchema.dependencies);
