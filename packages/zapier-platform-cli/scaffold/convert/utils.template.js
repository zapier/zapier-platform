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

// Explicitly run App.beforeRequest middlewares in the app code. Only necessary
// for WB scripting methods that send HTTP requests themselves, such as
// KEY_poll, KEY_search, KEY_write, KEY_read_resource, KEY_custom_action_fields
// and KEY_custom_search_fields.
const runBeforeMiddlewares = (request, z, bundle) => {
  const app = require('./');

  // Do it here so middlewares don't have to
  request.params = request.params || {};
  request.headers = request.headers || {};

  const befores = app.beforeRequest || [];
  return befores.reduce((prevResult, before) => {
    return Promise.resolve(prevResult).then(newRequest => {
      return before(newRequest, z, bundle);
    });
  }, request);
};

// Wrap legacy auth test triggers to handle array responses.
// Web builder test triggers can return arrays, which the CLI
// does not handle. So, if an array is returned from the test
// trigger, grab the first result and return that.
const ensureObject = perform => {
  return (z, bundle) =>
    perform(z, bundle).then(response => {
      if (Array.isArray(response) && response.length > 0) {
        return response[0];
      }
      return response;
    });
};

module.exports = {
  replaceVars,
  runBeforeMiddlewares,
  ensureObject
};
