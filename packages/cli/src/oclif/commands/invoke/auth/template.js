const { startSpinner, endSpinner } = require('../../../../utils/display');
const { customLogger } = require('../logger');
const { localAppCommand } = require('../../../../utils/local');

/**
 * Gets the auth template for the current app. No credentials needed.
 * Returns a template with {{bundle.authData.X}} placeholders.
 * @param {Object} context - The execution context
 * @returns {Promise<*>} The auth template result
 */
const templateAuth = async (context) => {
  startSpinner('Invoking getAuthTemplate');
  const result = await localAppCommand({
    command: 'getAuthTemplate',
    bundle: {},
    customLogger,
    calledFromCliInvoke: true,
  });
  endSpinner();
  return result;
};

module.exports = { templateAuth };
