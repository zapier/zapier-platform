const { callAPI } = require('../../utils/api');

module.exports = async function (options) {
  // We only need to run this for the register command
  if (!options || !options.id || options.id !== 'register') {
    return null;
  }

  const enumFieldChoices = {};
  let formFields;

  try {
    formFields = await callAPI('/apps/fields-choices', { skipDeployKey: true });
  } catch (e) {
    this.error(
      `Unable to connect to Zapier API. Please check your connection and try again. ${e}`,
    );
  }

  for (const fieldName of ['intention', 'role', 'app_category']) {
    enumFieldChoices[fieldName] = formFields[fieldName];
  }

  this.config.enumFieldChoices = enumFieldChoices;

  // This enables us to see all available options when running `zapier register --help`
  const cmd = options.config.findCommand('register');
  if (cmd && cmd.flags) {
    if (cmd.flags.audience) {
      cmd.flags.audience.options = formFields.intention.map(
        (audienceOption) => audienceOption.value,
      );
    }
    if (cmd.flags.role) {
      cmd.flags.role.options = formFields.role.map(
        (roleOption) => roleOption.value,
      );
    }
    if (cmd.flags.category) {
      cmd.flags.category.options = formFields.app_category.map(
        (categoryOption) => categoryOption.value,
      );
    }
  }
};
