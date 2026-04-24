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
  try {
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
  } catch (err) {
    endSpinner();
    if (err.message && err.message.includes('Unexpected command')) {
      throw new Error(
        '`auth render` requires zapier-platform-core from the PDE-7006-auth-template branch. ' +
          'Symlink it with: ln -sf ~/Projects/zapier-platform/packages/core node_modules/zapier-platform-core',
      );
    }
    throw err;
  }
};

module.exports = { renderAuth };
