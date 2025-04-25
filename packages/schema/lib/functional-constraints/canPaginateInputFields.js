const _ = require('lodash');
const jsonschema = require('jsonschema');
const actionTypes = ['triggers', 'searches', 'creates'];

const canPaginateInputFields = (definition) => {
  const errors = [];

  for (const actionType of actionTypes) {
    const group = definition[actionType] || {};
    _.each(group, (action, key) => {
      const inputFields = _.get(action, ['operation', 'inputFields'], []);
      inputFields.forEach((inputField, index) => {
        if (inputField.canPaginate) {
          if (
            !inputField.dynamic ||
            (typeof inputField.dynamic !== 'function' &&
              typeof inputField.dynamic !== 'object')
          ) {
            errors.push(
              new jsonschema.ValidationError(
                'canPaginate can only be set for input fields if dynamic is a function or a request.',
                inputField,
                '/PlainInputFieldSchema',
                `instance.${actionType}.${key}.operation.inputFields[${index}]`,
                'invalid',
                'canPaginate',
              ),
            );
          }
        }
      });
    });
  }

  return errors;
};

module.exports = canPaginateInputFields;
