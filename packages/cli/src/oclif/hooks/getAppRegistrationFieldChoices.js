const { callAPI } = require('../../utils/api');

module.exports = async function (options) {
  // We only need to run this for the register command
  if (!options || !options.id || options.id !== 'register') {
    return null;
  }

  const enumFieldChoices = {};
  const formFields = await callAPI('/apps/fields-choices');

  for (const fieldName of ['intention', 'role', 'app_category']) {
    enumFieldChoices[fieldName] = formFields[fieldName];
  }

  this.config.enumFieldChoices = enumFieldChoices;
};
