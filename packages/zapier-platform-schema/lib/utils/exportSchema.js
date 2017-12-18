'use strict';

const _ = require('lodash');
const packageJson = require('../../package.json');

const exportSchema = InitSchema => {
  const exportedSchema = {
    version: packageJson.version,
    schemas: {}
  };
  const addAndRecurse = Schema => {
    exportedSchema.schemas[Schema.id.replace('/', '')] = _.omit(
      Schema.schema,
      'examples',
      'antiExamples'
    );
    Schema.dependencies.map(addAndRecurse);
  };
  addAndRecurse(InitSchema);
  return exportedSchema;
};

module.exports = exportSchema;
