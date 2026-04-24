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
        '`auth template` requires latest version of zapier-platform-core. ' +
          'Upgrade zapier-platform-core in your dependencies.',
      );
    }
    throw err;
  }
};

module.exports = { templateAuth };
