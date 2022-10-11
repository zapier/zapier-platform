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
    const updateKey = searchOrCreateDef.update;

    const updateInputFields = _.get(
      definition.creates,
      `${updateKey}.operation.inputFields`,
      []
    );
    const updateInputKeys = updateInputFields.map(
      (inputField) => inputField.key
    );

    const searchOutputFields = _.get(
      definition.searches,
      `${searchKey}.operation.outputFields`,
      []
    );
    const searchOutputKeys = searchOutputFields.map(
      (outputField) => outputField.key
    );

    const searchOutputSampleKeys = _.keys(
      _.get(definition.searches, `${searchKey}.operation.sample`, {})
    );

    const allSearchOutputKeys = _.concat(
      searchOutputKeys,
      searchOutputSampleKeys
    );

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

    // Confirm searchOrCreate.update matches a creates.key, if it is defined
    if (updateKey && !definition.creates[updateKey]) {
      errors.push(
        new jsonschema.ValidationError(
          `must match a "key" from a create (options: ${createKeys})`,
          searchOrCreateDef,
          '/SearchOrCreateSchema',
          `instance.searchOrCreates.${key}.update`,
          'invalidKey',
          'update'
        )
      );
    }

    // Confirm searchOrCreate.updateInputFromSearchOutput existing implies searchOrCreate.update is defined
    if (searchOrCreateDef.updateInputFromSearchOutput && !updateKey) {
      errors.push(
        new jsonschema.ValidationError(
          `requires instance.searchOrCreates.${key}.update to be defined`,
          searchOrCreateDef,
          '/SearchOrCreateSchema',
          `instance.searchOrCreates.${key}.updateInputFromSearchOutput`,
          'invalid',
          'updateInputFromSearchOutput'
        )
      );
    }

    // Confirm searchOrCreate.searchUniqueInputToOutputConstraint existing implies searchOrCreate.update is defined
    if (searchOrCreateDef.searchUniqueInputToOutputConstraint && !updateKey) {
      errors.push(
        new jsonschema.ValidationError(
          `requires instance.searchOrCreates.${key}.update to be defined`,
          searchOrCreateDef,
          '/SearchOrCreateSchema',
          `instance.searchOrCreates.${key}.searchUniqueInputToOutputConstraint`,
          'invalid',
          'searchUniqueInputToOutputConstraint'
        )
      );
    }

    // Confirm searchOrCreate.updateInputFromSearchOutput contains objects with:
    // keys existing in creates[update].operation.inputFields.key
    // values existing in searches[search].operation.(outputFields.key|sample keys)
    if (searchOrCreateDef.updateInputFromSearchOutput && updateKey) {
      // Note that _.each({key: value}) provides the following callback method signature: (value, key) => {}
      _.each(
        searchOrCreateDef.updateInputFromSearchOutput,
        (searchOutputField, updateInputField) => {
          // Confirm searchOrCreate.updateInputFromSearchOutput's key exists in creates[update].operation.inputFields.key
          if (!updateInputKeys.includes(updateInputField)) {
            errors.push(
              new jsonschema.ValidationError(
                `must match a "key" from a creates.operation.inputFields (options: ${updateInputKeys})`,
                searchOrCreateDef,
                '/SearchOrCreateSchema',
                `instance.searchOrCreates.${key}.updateInputFromSearchOutputConstraint`,
                'invalidKey',
                'updateInputFromSearchOutput'
              )
            );
          }

          // Confirm searchOrCreate.updateInputFromSearchOutput's value exists in searches[search].operation.(outputFields.key|sample keys)
          if (!allSearchOutputKeys.includes(searchOutputField)) {
            errors.push(
              new jsonschema.ValidationError(
                `must match a "key" from searches.operation.(outputFields.key|sample keys). (options: ${allSearchOutputKeys})`,
                searchOrCreateDef,
                '/SearchOrCreateSchema',
                `instance.searchOrCreates.${key}.updateInputFromSearchOutputConstraint`,
                'invalidKey',
                'updateInputFromSearchOutput'
              )
            );
          }
        }
      );
    }

    return errors;
  });

  return errors;
};

module.exports = validateSearchOrCreateKeys;
