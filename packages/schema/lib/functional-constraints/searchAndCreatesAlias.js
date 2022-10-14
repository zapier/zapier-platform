'use strict';

const jsonschema = require('jsonschema');

const searchAndCreatesAliasConstraint = (definition) => {
  // Ensure that 'searchOrCreates' and 'searchAndCreates' don't appear together, since one is an alias of the other
  const errors = [];
  if (definition.searchOrCreates && definition.searchAndCreates) {
    errors.push(
      new jsonschema.ValidationError(
        `should not be used at the same time as its alias, searchAndCreates`,
        definition,
        `/AppSchema`,
        `instance.searchOrCreates`,
        'invalid',
        'key'
      )
    );
  }

  return errors;
};

module.exports = searchAndCreatesAliasConstraint;
