'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const validateSearchOrCreateKeys = (definition) => {
  if (!definition.searchOrCreates) {
    return [];
  }

  const errors = [];
  const searchKeys = _.keys(definition.searches);
  _.each(definition.searchOrCreates, (searchOrCreateDef, key) => {
    if (!definition.searches[key] || searchOrCreateDef.key !== key) {
      errors.push(new jsonschema.ValidationError(
        `must match a "key" from a search (options: ${searchKeys})`,
        searchOrCreateDef,
        '/SearchOrCreateSchema',
        `instance.searchOrCreates.${key}.key`,
        'invalidKey',
        'key'
      ));
    }
  });

  return errors;
};

module.exports = validateSearchOrCreateKeys;
