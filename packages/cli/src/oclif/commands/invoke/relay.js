const { localAppCommand } = require('../../../utils/local');

/**
 * Before-request middleware that replaces {{}} template syntax with safe placeholders.
 * This bypasses node-fetch's URL validation when variables are used in URLs.
 * @param {Object} request - The request object
 * @returns {Promise<Object>} The modified request object
 */
const replaceDoubleCurlies = async (request) => {
  // Use lcurly-fieldName-rcurly instead of {{fieldName}} to bypass node-fetch's
  // URL validation in case the variable is used in a URL.
  if (request.url) {
    request.url = request.url
      .replaceAll('{{', 'lcurly-')
      .replaceAll('}}', '-rcurly');
  }

  // The authorization header may confuse zapier.com and it's relay's job to add
  // it, so we delete it here.
  delete request.headers.authorization;
  delete request.headers.Authorization;

  return request;
};

/**
 * After-response middleware that restores {{}} template syntax from placeholders.
 * @param {Object} response - The response object
 * @returns {Promise<Object>} The modified response object
 */
const restoreDoubleCurlies = async (response) => {
  if (response.url) {
    response.url = response.url
      .replaceAll('lcurly-', '{{')
      .replaceAll('-rcurly', '}}');
  }
  if (response.request?.url) {
    response.request.url = response.request.url
      .replaceAll('lcurly-', '{{')
      .replaceAll('-rcurly', '}}');
  }
  return response;
};

/**
 * Wraps localAppCommand with relay mode support and error handling.
 * When relayAuthenticationId is provided, adds middleware to handle template syntax
 * and provides better error messages for domain filter errors.
 * @param {Object} args - Arguments to pass to localAppCommand
 * @param {string} [args.relayAuthenticationId] - If provided, enables relay mode
 * @returns {Promise<*>} The command output
 * @throws {Error} Enhanced error for domain filter blocks
 */
const localAppCommandWithRelayErrorHandler = async (args) => {
  if (args.relayAuthenticationId) {
    args = {
      ...args,
      beforeRequest: [replaceDoubleCurlies],
      afterResponse: [restoreDoubleCurlies],
    };
  }

  let output;
  try {
    output = await localAppCommand(args);
  } catch (outerError) {
    if (outerError.name === 'ResponseError') {
      let response;
      try {
        response = JSON.parse(outerError.message);
      } catch (innerError) {
        throw outerError;
      }
      if (typeof response.content === 'string') {
        const match = response.content.match(/domain filter `([^`]+)`/);
        if (!match) {
          throw outerError;
        }
        const domainFilter = match[1];
        const requestUrl = response.request.url
          .replaceAll('lcurly-', '{{')
          .replaceAll('-rcurly', '}}');
        throw new Error(
          `Request to ${requestUrl} was blocked. ` +
            `Only these domain names are allowed: ${domainFilter}. ` +
            'Contact Zapier team to verify your domain filter setting.',
        );
      }
    }
    throw outerError;
  }
  return output;
};

module.exports = {
  localAppCommandWithRelayErrorHandler,
};
