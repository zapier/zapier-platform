'use strict';

const _ = require('lodash');
const constants = require('../constants');
const utils = require('../utils');
const validate = require('./validate');

const test = context => {
  const extraEnv = {
    ZAPIER_BASE_ENDPOINT: constants.BASE_ENDPOINT
  };

  if (global.argOpts.debug) {
    extraEnv.LOG_TO_STDOUT = 'true';
    extraEnv.DETAILED_LOG_TO_STDOUT = 'true';
  }

  const validated = global.argOpts['skip-validate']
    ? Promise.resolve()
    : validate(context);

  return validated
    .then(() => utils.readCredentials(undefined, false))
    .then(credentials => {
      context.line(
        `Adding ${
          constants.AUTH_LOCATION
        } to environment as ZAPIER_DEPLOY_KEY...`
      );
      extraEnv.ZAPIER_DEPLOY_KEY = credentials.deployKey;
    })
    .then(() => {
      const env = _.extend({}, process.env, extraEnv);
      const commands = ['run', '--silent', 'test'];

      if (global.argOpts.timeout || global.argOpts.grep) {
        commands.push('--');

        if (global.argOpts.timeout) {
          commands.push(`--timeout=${global.argOpts.timeout}`);
        }

        if (global.argOpts.grep) {
          commands.push(`--grep=${global.argOpts.grep}`);
        }
      }

      context.line('Running test suite.');
      return utils
        .runCommand('npm', commands, { stdio: 'inherit', env })
        .then(stdout => {
          if (stdout) {
            context.line(stdout);
          }
        });
    });
};
test.argsSpec = [];
test.argOptsSpec = {
  debug: { flag: true, help: 'print zapier detailed logs to standard out' },
  timeout: { help: 'set test-case timeout in milliseconds [2000]' },
  grep: { help: 'only run tests matching pattern' },
  'skip-validate': {
    flag: true,
    help: 'forgo running `zapier validate` before `npm test`'
  }
};
test.help = 'Tests your app via `npm test`.';
test.example = 'zapier test';
test.docs = `
This command is effectively the same as \`npm test\`, except we also validate your app and set up the environment. We recommend using mocha as your testing framework.

**Arguments**

${utils.argsFragment(test.argsSpec)}
${utils.argOptsFragment(test.argOptsSpec)}

${'```'}bash
$ zapier test
#
#   triggers
#     hello world
#       ✓ should load fine (777ms)
#       ✓ should accept parameters (331ms)
#
#   2 passing (817ms)
#
${'```'}
`;

module.exports = test;
