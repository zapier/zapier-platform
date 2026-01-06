const { startSpinner, endSpinner } = require('../../../../utils/display');
const { customLogger } = require('../logger');
const { localAppCommandWithRelayErrorHandler } = require('../relay');

/**
 * Tests authentication by invoking the authentication.test method.
 * Supports both local auth data and relay mode with production credentials.
 * @param {Object} context - The execution context with authData and optional authId
 * @returns {Promise<*>} The test result from the authentication.test method
 */
const testAuth = async (context) => {
  startSpinner('Invoking authentication.test');
  const result = await localAppCommandWithRelayErrorHandler({
    command: 'execute',
    method: 'authentication.test',
    bundle: {
      authData: context.authData,
      meta: {
        ...context.meta,
        isTestingAuth: true,
      },
    },
    zcacheTestObj: context.zcacheTestObj,
    customLogger,
    calledFromCliInvoke: true,
    appId: context.appId,
    deployKey: context.deployKey,
    relayAuthenticationId: context.authId,
  });
  endSpinner();
  return result;
};

module.exports = { testAuth };
