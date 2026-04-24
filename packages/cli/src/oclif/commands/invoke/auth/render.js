const { customLogger } = require('../logger');
const { localAppCommand } = require('../../../../utils/local');

/**
 * Renders the auth template with real credentials from context.authData.
 * @param {Object} context - The execution context with authData
 * @returns {Promise<*>} The rendered auth template result
 */
const renderAuth = async (context) => {
  try {
    const result = await localAppCommand({
      command: 'renderAuthTemplate',
      bundle: {
        authData: context.authData,
      },
      customLogger,
      calledFromCliInvoke: true,
    });
    return result;
  } catch (err) {
    if (err.message && err.message.includes('Unexpected command')) {
      throw new Error(
        '`auth render` requires latest version of zapier-platform-core. ' +
          'Upgrade zapier-platform-core in your dependencies.',
      );
    }
    throw err;
  }
};

module.exports = { renderAuth };
