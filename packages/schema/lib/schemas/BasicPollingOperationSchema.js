'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicOperationSchema = require('./BasicOperationSchema');

// TODO: would be nice to deep merge these instead
// or maybe use allOf which is built into json-schema
const BasicPollingOperationSchema = JSON.parse(
  JSON.stringify(BasicOperationSchema.schema)
);

BasicPollingOperationSchema.id = '/BasicPollingOperationSchema';
BasicPollingOperationSchema.description =
  'Represents the fundamental mechanics of a trigger.';

BasicPollingOperationSchema.properties = {
  type: {
    // TODO: not a fan of this...
    description:
      'Clarify how this operation works (polling == pull or hook == push).',
    type: 'string',
    default: 'polling',
    enum: ['polling'], // notification?
  },
  resource: BasicPollingOperationSchema.properties.resource,
  perform: BasicPollingOperationSchema.properties.perform,
  canPaginate: {
    description: 'Does this endpoint support a page offset?',
    type: 'boolean',
  },
  inputFields: BasicPollingOperationSchema.properties.inputFields,
  outputFields: BasicPollingOperationSchema.properties.outputFields,
  sample: BasicPollingOperationSchema.properties.sample,
};

module.exports = makeSchema(
  BasicPollingOperationSchema,
  BasicOperationSchema.dependencies
);
