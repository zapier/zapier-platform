const { callAPI } = require('./api');
// const { readFile } = require('./files');
const debug = require('debug')('zapier:analytics');
const pkg = require('../../package.json');

const shouldRecordAnalytics = () => {
  // read from config file
  return process.NODE_ENV !== 'test';
};

const recordAnalytics = (command, isValidCommand, args, flags) => {
  const analyticsBody = {
    command,
    isValidCommand,
    numArgs: args.length,
    flags: {
      ...flags,
      ...(command === 'help' ? { helpCommand: args[0] } : {}) // include the beginning of args so we know what they want help on
    },
    os: process.platform,
    cliVersion: pkg.version
  };

  debug('sending', analyticsBody);
  // include options.skipDeployKey to be anonymous
  return shouldRecordAnalytics()
    ? callAPI(
        '/analytics',
        {
          method: 'POST',
          body: analyticsBody
        },
        true,
        false
      )
        .then(({ success }) => debug('success:', success))
        .catch(({ errText }) => debug('err:', errText))
    : Promise.resolve();
};

module.exports = { recordAnalytics };
