'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const getFieldKeys = (definition, path) => {
  const fields = _.get(definition, path, []);
  return fields.map((field) => field.key);
};

// This method differs from 'getFieldKeys' since here we obtain the actual object keys with Object.keys()
const getSearchOutputSampleKeys = (definition, searchKey) => {
  const searchOutputSampleFields = _.get(
    definition.searches,
    `${searchKey}.operation.sample`,
    {}
  );

  return Object.keys(searchOutputSampleFields);
};

const validateSearchOrCreateKeys = (definition) => {
  // searchAndCreates is an alias for searchOrCreates. Schema validation makes sure only one of them is defined.
  // If searchAndCreates is not empty, its content should be moved over to the searchOrCreates key for consistency.
  const searchOrCreates = definition.searchAndCreates
    ? definition.searchAndCreates
    : definition.searchOrCreates;

  if (!searchOrCreates) {
    return [];
  }

  const errors = [];

  const searchKeys = Object.keys(definition.searches);
  const createKeys = Object.keys(definition.creates);

  _.each(searchOrCreates, (searchOrCreateDef, key) => {
    const searchOrCreateKey = searchOrCreateDef.key;
    const searchKey = searchOrCreateDef.search;
    const createKey = searchOrCreateDef.create;
    const updateKey = searchOrCreateDef.update;

    const updateInputKeys = getFieldKeys(
      definition.creates,
      `${updateKey}.operation.inputFields`
    );
    const searchInputKeys = getFieldKeys(
      definition.searches,
      `${searchKey}.operation.inputFields`
    );
    const searchOutputKeys = getFieldKeys(
      definition.searches,
      `${searchKey}.operation.outputFields`
    );
    const searchOutputSampleKeys = getSearchOutputSampleKeys(
      definition,
      searchKey
    );

    // There are constraints where we check for keys in either outputFields or sample, so combining them is a shortcut
    const allSearchOutputKeys = new Set([
      ...searchOutputKeys,
      ...searchOutputSampleKeys,
    ]);

    // For some constraints, there is a difference between not "having" a key defined versus having one but with empty values
    const hasSearchOutputFields = _.has(
      definition.searches,
      `${searchKey}.operation.outputFields`
    );
    const hasSearchOutputSample = _.has(
      definition.searches,
      `${searchKey}.operation.sample`
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
          `requires searchOrCreates.${key}.update to be defined`,
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
          `requires searchOrCreates.${key}.update to be defined`,
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
      const updateInputOptionHint = _.isEmpty(updateInputKeys)
        ? '(no "key" found in inputFields)'
        : `(options: ${updateInputKeys})`;

      const searchOutputOptionHint = `(options: ${[...allSearchOutputKeys]})`;

      for (const [updateInputField, searchOutputField] of Object.entries(
        searchOrCreateDef.updateInputFromSearchOutput
      )) {
        if (!updateInputKeys.includes(updateInputField)) {
          errors.push(
            new jsonschema.ValidationError(
              `object key must match a "key" from a creates.${updateKey}.operation.inputFields ${updateInputOptionHint}`,
              searchOrCreateDef,
              '/SearchOrCreateSchema',
              `instance.searchOrCreates.${key}.updateInputFromSearchOutput`,
              'invalidKey'
            )
          );
        }

        if (
          (hasSearchOutputFields || hasSearchOutputSample) &&
          !allSearchOutputKeys.has(searchOutputField)
        ) {
          errors.push(
            new jsonschema.ValidationError(
              `object value must match a "key" from searches.${searchKey}.operation.(outputFields|sample) ${searchOutputOptionHint}`,
              searchOrCreateDef,
              '/SearchOrCreateSchema',
              `instance.searchOrCreates.${key}.updateInputFromSearchOutput`,
              'invalidKey'
            )
          );
        }
      }
    }

    // Confirm searchOrCreate.searchUniqueInputToOutputConstraint contains objects with:
    // keys existing in searches[search].operation.inputFields.key
    // values existing in searches[search].operation.(outputFields.key|sample keys), if they are defined
    if (searchOrCreateDef.searchUniqueInputToOutputConstraint && updateKey) {
      const searchInputOptionHint = _.isEmpty(searchInputKeys)
        ? '(no "key" found in inputFields)'
        : `(options: ${searchInputKeys})`;

      const searchOutputOptionHint = `(options: ${[...allSearchOutputKeys]})`;

      for (const [searchInputField, searchOutputField] of Object.entries(
        searchOrCreateDef.searchUniqueInputToOutputConstraint
      )) {
        if (!searchInputKeys.includes(searchInputField)) {
          errors.push(
            new jsonschema.ValidationError(
              `object key must match a "key" from a searches.${searchKey}.operation.inputFields ${searchInputOptionHint}`,
              searchOrCreateDef,
              '/SearchOrCreateSchema',
              `instance.searchOrCreates.${key}.searchUniqueInputToOutputConstraint`,
              'invalidKey'
            )
          );
        }

        if (
          (hasSearchOutputFields || hasSearchOutputSample) &&
          !allSearchOutputKeys.has(searchOutputField)
        ) {
          errors.push(
            new jsonschema.ValidationError(
              `object value must match a "key" from searches.${searchKey}.operation.(outputFields|sample) ${searchOutputOptionHint}`,
              searchOrCreateDef,
              '/SearchOrCreateSchema',
              `instance.searchOrCreates.${key}.searchUniqueInputToOutputConstraint`,
              'invalidKey'
            )
          );
        }
      }
    }

    return errors;
  });

  return errors;
};

module.exports = validateSearchOrCreateKeys;
