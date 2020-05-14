'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const validateSearchOrCreateKeys = (definition) => {
  if (!definition.searchOrCreates) {
    return [];
  }

  const errors = [];

  const searchKeys = _.keys(definition.searches);
  const createKeys = _.keys(definition.creates);

  _.each(definition.searchOrCreates, (searchOrCreateDef, key) => {
    const searchOrCreateKey = searchOrCreateDef.key;
    const searchKey = searchOrCreateDef.search;
    const createKey = searchOrCreateDef.create;

    // Confirm searchOrCreate.key matches a searches.key (current Zapier editor limitation)
    if (!definition.searches[searchOrCreateKey]) {
      errors.push(
        new jsonschema.ValidationError(
          `must match a "key" from a search (options: ${searchKeys})`,
          searchOrCreateDef,
          '/SearchOrCreateSchema',
          `instance.searchOrCreates.${key}.key`,
          'invalidKey',
          'key'
        )
      );
    }

    // Confirm searchOrCreate.search matches a searches.key
    if (!definition.searches[searchKey]) {
      errors.push(
        new jsonschema.ValidationError(
          `must match a "key" from a search (options: ${searchKeys})`,
          searchOrCreateDef,
          '/SearchOrCreateSchema',
          `instance.searchOrCreates.${key}.search`,
          'invalidKey',
          'search'
        )
      );
    }

    // Confirm searchOrCreate.create matches a creates.key
    if (!definition.creates[createKey]) {
      errors.push(
        new jsonschema.ValidationError(
          `must match a "key" from a create (options: ${createKeys})`,
          searchOrCreateDef,
          '/SearchOrCreateSchema',
          `instance.searchOrCreates.${key}.create`,
          'invalidKey',
          'create'
        )
      );
    }
  });

  return errors;
};

module.exports = validateSearchOrCreateKeys;
