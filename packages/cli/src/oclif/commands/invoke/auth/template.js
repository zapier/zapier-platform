const { customLogger } = require('../logger');
const { localAppCommand } = require('../../../../utils/local');

/**
 * Gets the auth template for the current app. No credentials needed.
 * Returns a template with {{bundle.authData.X}} placeholders.
 * @param {Object} context - The execution context
 * @returns {Promise<*>} The auth template result
 */
const templateAuth = async (context) => {
  try {
    const result = await localAppCommand({
      command: 'getAuthTemplate',
      bundle: {},
      customLogger,
      calledFromCliInvoke: true,
    });
    return result;
  } catch (err) {
    if (err.message && err.message.includes('Unexpected command')) {
      throw new Error(
        '`auth template` requires zapier-platform-core from the PDE-7006-auth-template branch. ' +
          'Symlink it with: ln -sf ~/Projects/zapier-platform/packages/core node_modules/zapier-platform-core',
      );
    }
    throw err;
  }
};

module.exports = { templateAuth };
