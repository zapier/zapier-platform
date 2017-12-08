// Utility functions

const _ = require('lodash');

// Does string replacement ala WB, using bundle and a potential result object
const replaceVars = (templateString, bundle, result) => {
  const options = {
    interpolate: /{{([\s\S]+?)}}/g
  };
  const values = _.extend({}, bundle.authData, bundle.inputData, result);
  return _.template(templateString, options)(values);
};

module.exports = {
  replaceVars
};
