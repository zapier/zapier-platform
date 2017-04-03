'use strict';

const _ = require('lodash');
const constants = require('../constants');
const utils = require('../utils');
const LAMBDA_VERSION = 'v4.3.2';

const test = (context) => {
  const extraEnv = {};

  if (!global.argOpts['very-quiet']) {
    extraEnv.LOG_TO_STDOUT = 'true';
  }
  if (!global.argOpts.quiet && !global.argOpts['very-quiet']) {
    extraEnv.DETAILED_LOG_TO_STDOUT = 'true';
  }

  if (process.version !== LAMBDA_VERSION) {
    throw new Error(`You're running tests on Node ${process.version}, but Zapier runs your code on ${LAMBDA_VERSION}. The version numbers must match. See https://github.com/zapier/zapier-platform-cli#requirements for more info.`);
  }

  return utils.readCredentials(undefined, false)
    .then((credentials) => {
      context.line('Adding ' + constants.AUTH_LOCATION + ' to environment as ZAPIER_DEPLOY_KEY...');
      extraEnv.ZAPIER_DEPLOY_KEY = credentials.deployKey;
    })
    .then(() => {
      const env = _.extend({}, process.env, extraEnv);
      const commands = ['run', '--silent', 'test'];

      if (global.argOpts.timeout) {
        commands.push('--');
        commands.push(`--timeout=${global.argOpts.timeout}`);
      }

      return utils.runCommand('npm', commands, {stdio: 'inherit', env})
        .then((stdout) => {
          if (stdout) {
            context.line(stdout);
          }
        });
    });
};
test.argsSpec = [
];
test.argOptsSpec = {
  quiet: {flag: true, help: 'do not print zapier detailed logs to standard out'},
  'very-quiet': {flag: true, help: 'do not print zapier summary or detail logs to standard out'},
  timeout: {help: 'add a default timeout to mocha, in milliseconds'},
};
test.help = 'Tests your app via `npm test`.';
test.example = 'zapier test';
test.docs = `\
This command is effectively the same as \`npm test\`, except we wire in some custom tests to validate your app. We recommend using mocha as your testing framework.

**Arguments**

${utils.argsFragment(test.argsSpec)}
${utils.argOptsFragment(test.argOptsSpec)}

${'```'}bash
$ zapier test
#
#   app
#     validation
#       ✓ should be a valid app
#
#   triggers
#     hello world
#       ✓ should load fine (777ms)
#
#   2 passing (817ms)
#
${'```'}
`;

module.exports = test;
