const _ = require('lodash');

const { localAppCommand } = require('../../../../utils/local');
const { startSpinner, endSpinner } = require('../../../../utils/display');
const { customLogger } = require('../logger');

/**
 * Refreshes OAuth2 access token using the refresh token.
 * @param {Object} context - The execution context with current authData
 * @returns {Promise<Object>} New auth data with refreshed tokens
 */
const refreshOAuth2 = async (context) => {
  startSpinner('Invoking authentication.oauth2Config.refreshAccessToken');

  const newAuthData = await localAppCommand({
    command: 'execute',
    method: 'authentication.oauth2Config.refreshAccessToken',
    bundle: {
      authData: context.authData,
    },
    zcacheTestObj: context.zcacheTestObj,
    customLogger,
    calledFromCliInvoke: true,
  });

  endSpinner();
  return newAuthData;
};

/**
 * Refreshes session authentication by calling the session config perform method.
 * @param {Object} context - The execution context with current authData
 * @returns {Promise<Object>} New session data
 */
const refreshSessionAuth = async (context) => {
  startSpinner('Invoking authentication.sessionConfig.perform');

  const sessionData = await localAppCommand({
    command: 'execute',
    method: 'authentication.sessionConfig.perform',
    bundle: {
      authData: context.authData,
    },
    zcacheTestObj: context.zcacheTestObj,
    customLogger,
    calledFromCliInvoke: true,
  });

  endSpinner();
  return sessionData;
};

/**
 * Main entry point for refreshing authentication.
 * Routes to the appropriate refresh handler based on authentication type.
 * @param {Object} context - The execution context
 * @returns {Promise<Object|null>} New auth data or null if no authentication needed
 * @throws {Error} If auth type doesn't support refresh or no auth data exists
 */
const refreshAuth = async (context) => {
  const authentication = context.appDefinition.authentication;
  if (!authentication) {
    console.warn(
      "Your integration doesn't seem to need authentication. " +
        "If that isn't true, the app definition should have " +
        'an `authentication` object at the root level.',
    );
    return null;
  }
  if (_.isEmpty(context.authData)) {
    throw new Error(
      'No auth data found in the .env file. Run `zapier invoke auth start` first to initialize the auth data.',
    );
  }
  switch (authentication.type) {
    case 'oauth2':
      return refreshOAuth2(context);
    case 'session':
      return refreshSessionAuth(context);
    default:
      throw new Error(
        `This command doesn't support refreshing authentication type "${authentication.type}".`,
      );
  }
};

module.exports = { refreshAuth };
