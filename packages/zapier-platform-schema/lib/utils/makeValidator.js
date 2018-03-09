'use strict';

const jsonschema = require('jsonschema');
const links = require('./links');
const functionalConstraints = require('../functional-constraints');

const makeLinks = (error, makerFunc) => {
  if (typeof error.schema == 'string') {
    return [makerFunc(error.schema)];
  }
  if (
    ['anyOf', 'oneOf', 'allOf'].indexOf(error.name) !== -1 &&
    error.argument &&
    error.argument.length
  ) {
    return error.argument.map(makerFunc);
  }
  return [];
};

const makeValidator = (mainSchema, subSchemas) => {
  const schemas = [mainSchema].concat(subSchemas || []);
  const v = new jsonschema.Validator();
  schemas.forEach(Schema => {
    v.addSchema(Schema, Schema.id);
  });
  return {
    validate: definition => {
      const results = v.validate(definition, mainSchema);
      results.errors = results.errors.concat(
        functionalConstraints.run(definition, mainSchema)
      );
      results.errors = results.errors.map(error => {
        error.codeLinks = makeLinks(error, links.makeCodeLink);
        error.docLinks = makeLinks(error, links.makeDocLink);
        return error;
      });
      return results;
    }
  };
};

module.exports = makeValidator;
