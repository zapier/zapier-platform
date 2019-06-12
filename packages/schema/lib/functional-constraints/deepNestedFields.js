'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

const collectErrors = (inputFields, path) => {
  const errors = [];

  _.each(inputFields, (inputField, index) => {
    if (inputField.children) {
      if (inputField.children.length === 0) {
        errors.push(
          new jsonschema.ValidationError(
            'must not be empty.',
            inputField,
            '/FieldSchema',
            `instance.${path}.inputFields[${index}].children`,
            'empty',
            'inputFields'
          )
        );
      } else {
        const hasDeeplyNestedChildren = _.some(
          inputField.children,
          child => child.children
        );

        if (hasDeeplyNestedChildren) {
          errors.push(
            new jsonschema.ValidationError(
              'must not contain deeply nested child fields. One level max.',
              inputField,
              '/FieldSchema',
              `instance.${path}.inputFields[${index}]`,
              'deepNesting',
              'inputFields'
            )
          );
        }
      }
    }
  });

  return errors;
};

const validateFieldNesting = definition => {
  let errors = [];

  _.each(['triggers', 'searches', 'creates'], typeOf => {
    if (definition[typeOf]) {
      _.each(definition[typeOf], actionDef => {
        if (actionDef.operation && actionDef.operation.inputFields) {
          errors = errors.concat(
            collectErrors(
              actionDef.operation.inputFields,
              `${typeOf}.${actionDef.key}`
            )
          );
        }
      });
    }
  });

  return errors;
};

module.exports = validateFieldNesting;
