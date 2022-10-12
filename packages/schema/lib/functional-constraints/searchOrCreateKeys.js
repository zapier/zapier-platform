'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const getUpdateInputKeys = ({ definition, updateKey }) => {
  const updateInputFields = _.get(
    definition.creates,
    `${updateKey}.operation.inputFields`,
    []
  );

  return updateInputFields.map((inputField) => inputField.key);
};

const getSearchInputKeys = ({ definition, searchKey }) => {
  const searchInputFields = _.get(
    definition.searches,
    `${searchKey}.operation.inputFields`,
    []
  );
  return searchInputFields.map((inputField) => inputField.key);
};

const getSearchOutputKeys = ({ definition, searchKey }) => {
  const searchOutputFields = _.get(
    definition.searches,
    `${searchKey}.operation.outputFields`,
    []
  );

  return searchOutputFields.map((outputField) => outputField.key);
};

const getSearchOutputSampleKeys = ({ definition, searchKey }) => {
  const searchOutputSampleFields = _.get(
    definition.searches,
    `${searchKey}.operation.sample`,
    {}
  );

  return _.keys(searchOutputSampleFields);
};

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

    const updateInputKeys = getUpdateInputKeys({ definition, updateKey });
    const searchInputKeys = getSearchInputKeys({ definition, searchKey });
    const searchOutputKeys = getSearchOutputKeys({ definition, searchKey });
    const searchOutputSampleKeys = getSearchOutputSampleKeys({
      definition,
      searchKey,
    });

    // There are constraints where we check for keys in either outputFields or sample, so combining them is a shortcut
    const allSearchOutputKeys = _.concat(
      searchOutputKeys,
      searchOutputSampleKeys
    );

    // For some constraints, there is a difference between not "having" a key defined versus having one but with empty values
    const hasSearchOutputFields = _.has(
      definition.searches,
      `${searchKey}.operation.outputFields`
    );
    const hasSearchOutputSample = _.has(
      _.get(definition.searches, `${searchKey}.operation.sample`)
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
          'invalidKey'
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
          'invalid'
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
          'invalid'
        )
      );
    }

    // Confirm searchOrCreate.updateInputFromSearchOutput contains objects with:
    // keys existing in creates[update].operation.inputFields.key
    // values existing in searches[search].operation.(outputFields.key|sample keys), if they are defined
    if (searchOrCreateDef.updateInputFromSearchOutput && updateKey) {
      // Note that _.each({key: value}) provides the following callback method signature: (value, key) => {}
      _.each(
        searchOrCreateDef.updateInputFromSearchOutput,
        (searchOutputField, updateInputField) => {
          // Confirm searchOrCreate.updateInputFromSearchOutput's key exists in creates[update].operation.inputFields.key
          if (_.isEmpty(updateInputKeys)) {
            // Provide a specific error if no possible keys were found
            errors.push(
              new jsonschema.ValidationError(
                `must match a "key" from a creates.operation.inputFields (no "key" found in inputFields)`,
                searchOrCreateDef,
                '/SearchOrCreateSchema',
                `instance.searchOrCreates.${key}.updateInputFromSearchOutput`,
                'invalidKey'
              )
            );
          } else if (!updateInputKeys.includes(updateInputField)) {
            errors.push(
              new jsonschema.ValidationError(
                `must match a "key" from a creates.operation.inputFields (options: ${updateInputKeys})`,
                searchOrCreateDef,
                '/SearchOrCreateSchema',
                `instance.searchOrCreates.${key}.updateInputFromSearchOutput`,
                'invalidKey'
              )
            );
          }

          // Confirm searchOrCreate.updateInputFromSearchOutput's value exists in searches[search].operation.(outputFields.key|sample keys), if they are defined
          if (
            (hasSearchOutputFields || hasSearchOutputSample) &&
            !allSearchOutputKeys.includes(searchOutputField)
          ) {
            errors.push(
              new jsonschema.ValidationError(
                `must match a "key" from searches.operation.(outputFields.key|sample keys). (options: ${allSearchOutputKeys})`,
                searchOrCreateDef,
                '/SearchOrCreateSchema',
                `instance.searchOrCreates.${key}.updateInputFromSearchOutput`,
                'invalidKey'
              )
            );
          }
        }
      );
    }

    // Confirm searchOrCreate.searchUniqueInputToOutputConstraint contains objects with:
    // keys existing in searches[search].operation.inputFields.key
    // values existing in searches[search].operation.(outputFields.key|sample keys), if they are defined
    if (searchOrCreateDef.searchUniqueInputToOutputConstraint && updateKey) {
      // Note that _.each({key: value}) provides the following callback method signature: (value, key) => {}
      _.each(
        searchOrCreateDef.searchUniqueInputToOutputConstraint,
        (searchOutputField, searchInputField) => {
          // Confirm searchOrCreate.searchUniqueInputToOutputConstraint's key exists in searches[search].operation.inputFields.key
          if (_.isEmpty(searchInputKeys)) {
            // Provide a specific error if no possible keys were found
            errors.push(
              new jsonschema.ValidationError(
                `must match a "key" from a searches.operation.inputFields (no "key" found in inputFields)`,
                searchOrCreateDef,
                '/SearchOrCreateSchema',
                `instance.searchOrCreates.${key}.searchUniqueInputToOutputConstraint`,
                'invalidKey'
              )
            );
          } else if (!searchInputKeys.includes(searchInputField)) {
            errors.push(
              new jsonschema.ValidationError(
                `must match a "key" from a searches.operation.inputFields (options: ${searchInputKeys})`,
                searchOrCreateDef,
                '/SearchOrCreateSchema',
                `instance.searchOrCreates.${key}.searchUniqueInputToOutputConstraint`,
                'invalidKey'
              )
            );
          }

          // Confirm searchOrCreate.searchUniqueInputToOutputConstraint's value exists in searches[search].operation.(outputFields.key|sample keys), if any of them are defined
          if (
            (hasSearchOutputFields || hasSearchOutputSample) &&
            !allSearchOutputKeys.includes(searchOutputField)
          ) {
            errors.push(
              new jsonschema.ValidationError(
                `must match a "key" from searches.operation.(outputFields.key|sample keys). (options: ${allSearchOutputKeys})`,
                searchOrCreateDef,
                '/SearchOrCreateSchema',
                `instance.searchOrCreates.${key}.searchUniqueInputToOutputConstraint`,
                'invalidKey'
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
