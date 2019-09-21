const _ = require('lodash');
const jsonschema = require('jsonschema');

const actionTypes = ['triggers', 'searches', 'creates'];

const labelWhenVisible = definition => {
  const errors = [];

  for (const actionType of actionTypes) {
    const group = definition[actionType] || {};
    _.each(group, (action, key) => {
      const { display } = action;
      if (!display.hidden && !(display.label && display.description)) {
        errors.push(
          new jsonschema.ValidationError(
            `visible actions must have a label and description`,
            action,
            `/${_.capitalize(actionType)}Schema`,
            `instance.${key}.key`,
            'invalid',
            'key'
          )
        );
      }
    });
  }

  return errors;
};

module.exports = labelWhenVisible;
