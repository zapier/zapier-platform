const { startSpinner, endSpinner } = require('../../../../utils/display');
const { customLogger } = require('../logger');
const { localAppCommand } = require('../../../../utils/local');

/**
 * Renders the auth template with real credentials from context.authData.
 * @param {Object} context - The execution context with authData
 * @returns {Promise<*>} The rendered auth template result
 */
const renderAuth = async (context) => {
  startSpinner('Invoking renderAuthTemplate');
  const result = await localAppCommand({
    command: 'renderAuthTemplate',
    bundle: {
      authData: context.authData,
    },
    customLogger,
    calledFromCliInvoke: true,
  });
  endSpinner();
  return result;
};

module.exports = { renderAuth };
