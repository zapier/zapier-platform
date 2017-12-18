'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicActionOperationSchema = require('./BasicActionOperationSchema');

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
  type: 'boolean'
};

module.exports = makeSchema(
  BasicCreateActionOperationSchema,
  BasicActionOperationSchema.dependencies
);
