const { callAPI } = require('./api');
// const { readFile } = require('./files');
const debug = require('debug')('zapier:analytics');
const pkg = require('../../package.json');
const { getLinkedAppConfig } = require('../utils/api');
const { ANALYTICS_KEY, ANALYTICS_MODES, IS_TESTING } = require('../constants');
const { readUserConfig, writeUserConfig } = require('./userConfig');

const currentAnalyticsMode = async () => {
  const { [ANALYTICS_KEY]: mode } = await readUserConfig();
  return mode || ANALYTICS_MODES.enabled;
};

const setAnalyticsMode = (newMode) => {
  // the CLI validates that newMode is a valid option
  return writeUserConfig({ [ANALYTICS_KEY]: newMode });
};

const shouldSkipAnalytics = (mode) =>
  IS_TESTING ||
  process.env.DISABLE_ZAPIER_ANALYTICS ||
  mode === ANALYTICS_MODES.disabled;

const recordAnalytics = async (command, isValidCommand, args, flags) => {
  const analyticsMode = await currentAnalyticsMode();

  if (shouldSkipAnalytics(analyticsMode)) {
    debug('skipping analytics');
    return;
  }
  const argKeys = Object.keys(args);
  const flagKeys = Object.keys(flags);
  const shouldRecordAnonymously = analyticsMode === ANALYTICS_MODES.anonymous;

  const integrationIDKey = argKeys.find(
    (key) => key.toLowerCase() === 'integrationid',
  );
  const integrationID = integrationIDKey ? args[integrationIDKey] : undefined;

  // Some commands ( like "zapier convert" ) won't have an app directory when called.
  // Instead, having the app ID in the arguments.
  // In this case, we fallback to using "integrationid" in arguments ( if it's there )
  // and don't want to "explode" if appID is missing
  const linkedAppId =
    (await getLinkedAppConfig(undefined, false))?.id || integrationID;

  // to make this more testable, we should split this out into its own function
  const analyticsBody = {
    command,
    isValidCommand,
    numArgs: argKeys.length,
    appId: linkedAppId,
    argsKeys: argKeys,
    flagKeys,
    cliVersion: pkg.version,
    os: shouldRecordAnonymously ? undefined : process.platform,
  };

  // provide a little more visibility about whether we're getting customuserId
  // it's actually controlled via the `skipDeployKey` below
  debug('sending', { ...analyticsBody, sendUserId: !shouldRecordAnonymously });
  return callAPI(
    '/analytics',
    {
      method: 'POST',
      body: analyticsBody,
      skipDeployKey: shouldRecordAnonymously,
    },
    true,
    false,
  )
    .then(({ success }) => debug('success:', success))
    .catch(({ errText }) => debug('err:', errText));
};

module.exports = {
  currentAnalyticsMode,
  recordAnalytics,
  shouldSkipAnalytics,
  modes: ANALYTICS_MODES,
  setAnalyticsMode,
};
