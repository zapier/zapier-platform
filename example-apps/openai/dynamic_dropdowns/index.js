/* eslint-disable camelcase */
const list_models = require('./list_models.js');

// If you add a new Dynamic Dropdown, make sure it is exported here to display in the Zapier Editor
module.exports = {
  [list_models.key]: list_models,
};
