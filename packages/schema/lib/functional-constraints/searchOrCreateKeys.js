'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const getFieldKeys = (definition, path) => {
  const fields = _.get(definition, path, []);
  // Filter out any `undefined` values using .filter(), which may happen due to incoming inputFields
  // containing functions instead of plain Objects.
  return fields.map((field) => field.key).filter((key) => key);
};

// This method differs from 'getFieldKeys' since here we obtain the actual object keys with Object.keys()
const getSearchOutputSampleKeys = (definition, searchKey) => {
  const searchOutputSampleFields = _.get(
    definition.searches,
    `${searchKey}.operation.sample`,
    {},
  );

  return Object.keys(searchOutputSampleFields);
};

const validateSearchCreateKeys = (definition, searchCreatesKey) => {
  const searchCreates = definition[searchCreatesKey];

  if (!searchCreates) {
    return [];
  }

  const errors = [];

  const searchKeys = Object.keys(definition.searches);
  const createKeys = Object.keys(definition.creates);

  _.each(searchCreates, (searchOrCreateDef, key) => {
    const searchOrCreateKey = searchOrCreateDef.key;
    const searchKey = searchOrCreateDef.search;
    const createKey = searchOrCreateDef.create;
    const updateKey = searchOrCreateDef.update;

    const updateInputKeys = getFieldKeys(
      definition.creates,
      `${updateKey}.operation.inputFields`,
    );
    const searchInputKeys = getFieldKeys(
      definition.searches,
      `${searchKey}.operation.inputFields`,
    );
    const searchOutputKeys = getFieldKeys(
      definition.searches,
      `${searchKey}.operation.outputFields`,
    );
    const searchOutputSampleKeys = getSearchOutputSampleKeys(
      definition,
      searchKey,
    );

    // There are constraints where we check for keys in either outputFields or sample, so combining them is a shortcut
    const allSearchOutputKeys = new Set([
      ...searchOutputKeys,
      ...searchOutputSampleKeys,
    ]);

    // For some constraints, there is a difference between not "having" a key defined versus having one but with empty values
    const hasSearchOutputFields = _.has(
      definition.searches,
      `${searchKey}.operation.outputFields`,
    );
    const hasSearchOutputSample = _.has(
      definition.searches,
      `${searchKey}.operation.sample`,
    );

    // Confirm searchOrCreate.key matches a searches.key (current Zapier editor limitation)
    if (!definition.searches[searchOrCreateKey]) {
      errors.push(
        new jsonschema.ValidationError(
          `must match a "key" from a search (options: ${searchKeys})`,
          searchOrCreateDef,
          '/SearchOrCreateSchema',
          `instance.${searchCreatesKey}.${key}.key`,
          'invalidKey',
          'key',
        ),
      );
    }

    // Confirm searchOrCreate.search matches a searches.key
    if (!definition.searches[searchKey]) {
      errors.push(
        new jsonschema.ValidationError(
          `must match a "key" from a search (options: ${searchKeys})`,
          searchOrCreateDef,
          '/SearchOrCreateSchema',
          `instance.${searchCreatesKey}.${key}.search`,
          'invalidKey',
          'search',
        ),
      );
    }

    // Confirm searchOrCreate.create matches a creates.key
    if (!definition.creates[createKey]) {
      errors.push(
        new jsonschema.ValidationError(
          `must match a "key" from a create (options: ${createKeys})`,
          searchOrCreateDef,
          '/SearchOrCreateSchema',
          `instance.${searchCreatesKey}.${key}.create`,
          'invalidKey',
          'create',
        ),
      );
    }

    // Confirm searchOrCreate.update matches a creates.key, if it is defined
    if (updateKey && !definition.creates[updateKey]) {
      errors.push(
        new jsonschema.ValidationError(
          `must match a "key" from a create (options: ${createKeys})`,
          searchOrCreateDef,
          '/SearchOrCreateSchema',
          `instance.${searchCreatesKey}.${key}.update`,
          'invalidKey',
        ),
      );
    }

    // Confirm searchOrCreate.updateInputFromSearchOutput existing implies searchOrCreate.update is defined
    if (searchOrCreateDef.updateInputFromSearchOutput && !updateKey) {
      errors.push(
        new jsonschema.ValidationError(
          `requires searchOrCreates.${key}.update to be defined`,
          searchOrCreateDef,
          '/SearchOrCreateSchema',
          `instance.${searchCreatesKey}.${key}.updateInputFromSearchOutput`,
          'invalid',
        ),
      );
    }

    // Confirm searchOrCreate.searchUniqueInputToOutputConstraint existing implies searchOrCreate.update is defined
    if (searchOrCreateDef.searchUniqueInputToOutputConstraint && !updateKey) {
      errors.push(
        new jsonschema.ValidationError(
          `requires searchOrCreates.${key}.update to be defined`,
          searchOrCreateDef,
          '/SearchOrCreateSchema',
          `instance.${searchCreatesKey}.${key}.searchUniqueInputToOutputConstraint`,
          'invalid',
        ),
      );
    }

    // Confirm searchOrCreate.updateInputFromSearchOutput contains objects with:
    // keys existing in creates[update].operation.inputFields.key
    // values existing in searches[search].operation.(outputFields.key|sample keys), if they are defined
    if (
      updateKey &&
      _.isPlainObject(searchOrCreateDef.updateInputFromSearchOutput)
    ) {
      const updateInputOptionHint = _.isEmpty(updateInputKeys)
        ? '(no "key" found in inputFields)'
        : `(options: ${updateInputKeys})`;

      const searchOutputOptionHint = `(options: ${[...allSearchOutputKeys]})`;

      for (const [updateInputField, searchOutputField] of Object.entries(
        searchOrCreateDef.updateInputFromSearchOutput,
      )) {
        if (!updateInputKeys.includes(updateInputField)) {
          errors.push(
            new jsonschema.ValidationError(
              `object key must match a "key" from a creates.${updateKey}.operation.inputFields ${updateInputOptionHint}`,
              searchOrCreateDef,
              '/SearchOrCreateSchema',
              `instance.${searchCreatesKey}.${key}.updateInputFromSearchOutput`,
              'invalidKey',
            ),
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
              `instance.${searchCreatesKey}.${key}.updateInputFromSearchOutput`,
              'invalidKey',
            ),
          );
        }
      }
    }

    // Confirm searchOrCreate.searchUniqueInputToOutputConstraint contains objects with:
    // keys existing in searches[search].operation.inputFields.key
    // values existing in searches[search].operation.(outputFields.key|sample keys), if they are defined
    if (
      updateKey &&
      _.isPlainObject(searchOrCreateDef.searchUniqueInputToOutputConstraint)
    ) {
      const searchInputOptionHint = _.isEmpty(searchInputKeys)
        ? '(no "key" found in inputFields)'
        : `(options: ${searchInputKeys})`;

      const searchOutputOptionHint = `(options: ${[...allSearchOutputKeys]})`;

      for (const [searchInputField, searchOutputField] of Object.entries(
        searchOrCreateDef.searchUniqueInputToOutputConstraint,
      )) {
        if (!searchInputKeys.includes(searchInputField)) {
          errors.push(
            new jsonschema.ValidationError(
              `object key must match a "key" from a searches.${searchKey}.operation.inputFields ${searchInputOptionHint}`,
              searchOrCreateDef,
              '/SearchOrCreateSchema',
              `instance.${searchCreatesKey}.${key}.searchUniqueInputToOutputConstraint`,
              'invalidKey',
            ),
          );
        }

        if (
          (hasSearchOutputFields || hasSearchOutputSample) &&
          typeof searchOutputField === 'string' &&
          !allSearchOutputKeys.has(searchOutputField)
        ) {
          errors.push(
            new jsonschema.ValidationError(
              `object value must match a "key" from searches.${searchKey}.operation.(outputFields|sample) ${searchOutputOptionHint}`,
              searchOrCreateDef,
              '/SearchOrCreateSchema',
              `instance.${searchCreatesKey}.${key}.searchUniqueInputToOutputConstraint`,
              'invalidKey',
            ),
          );
        }
      }
    }

    return errors;
  });

  return errors;
};

const validateSearchOrCreateKeys = (definition) => {
  // searchAndCreates is an alias for searchOrCreates. They are the same, but
  // you can define both searchAndCreates and searchOrCreates to avoid search
  // key collision.
  return [
    ...validateSearchCreateKeys(definition, 'searchOrCreates'),
    ...validateSearchCreateKeys(definition, 'searchAndCreates'),
  ];
};

module.exports = validateSearchOrCreateKeys;
