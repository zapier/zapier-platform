'use strict';

const _ = require('lodash');

const makeValidator = require('./makeValidator');

const getRawSchema = schema => schema.schema;

const getDependencies = schema => schema.dependencies;

const flattenDependencies = schemas => {
  schemas = schemas || [];
  return _.flatten(schemas.map(getDependencies).concat(schemas));
};

const makeSchema = (schemaDefinition, schemaDependencies) => {
  const dependencies = flattenDependencies(schemaDependencies);
  const validatorDependencies = dependencies.map(getRawSchema);
  return {
    dependencies,
    id: schemaDefinition.id,
    schema: schemaDefinition,
    validate: makeValidator(schemaDefinition, validatorDependencies).validate
  };
};

module.exports = makeSchema;
