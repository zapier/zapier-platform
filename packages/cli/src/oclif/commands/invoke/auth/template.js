const { customLogger } = require('../logger');
const { localAppCommand } = require('../../../../utils/local');

/**
 * Gets the auth template for the current app. No credentials needed.
 * Returns a template with {{bundle.authData.X}} placeholders.
 *
 * `context.declaredEnvNames` are the app's own environment variable names,
 * taken from .env. The app's environment is loaded during capture, so
 * middleware reading process.env gets the real value; core maps any captured
 * value back to {{process.env.NAME}} for these names instead of leaving it in
 * the template. Sending them mirrors what the backend does in production.
 * @param {Object} context - The execution context
 * @returns {Promise<*>} The auth template result
 */
const templateAuth = async (context) => {
  try {
    const result = await localAppCommand({
      command: 'getAuthTemplate',
      bundle: {
        declaredEnvNames: context.declaredEnvNames || [],
      },
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
