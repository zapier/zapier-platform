const { callAPI } = require('./api');
// const { readFile } = require('./files');
const debug = require('debug')('zapier:analytics');
const pkg = require('../../package.json');
const { ANALYTICS_KEY, ANALYTICS_MODES } = require('../constants');
const { readUserConfig } = require('./userConfig');

const recordAnalytics = async (command, isValidCommand, args, flags) => {
  const { [ANALYTICS_KEY]: analyticsMode } = await readUserConfig();

  const shouldRecordAnalytics =
    process.NODE_ENV !== 'test' && analyticsMode !== ANALYTICS_MODES.disabled;

  if (!shouldRecordAnalytics) {
    return;
  }

  const shouldRecordAnonymously = analyticsMode === ANALYTICS_MODES.anonymous;

  const analyticsBody = {
    command,
    isValidCommand,
    numArgs: args.length,
    flags: {
      ...flags,
      ...(command === 'help' ? { helpCommand: args[0] } : {}) // include the beginning of args so we know what they want help on
    },
    cliVersion: pkg.version,
    os: shouldRecordAnonymously ? undefined : process.platform
  };

  debug('sending', analyticsBody);
  // include options.skipDeployKey to be anonymous
  return shouldRecordAnalytics
    ? callAPI(
        '/analytics',
        {
          method: 'POST',
          body: analyticsBody,
          skipDeployKey: shouldRecordAnonymously
        },
        true,
        false
      )
        .then(({ success }) => debug('success:', success))
        .catch(({ errText }) => debug('err:', errText))
    : Promise.resolve();
};

module.exports = { recordAnalytics };
