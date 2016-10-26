const _ = require('lodash');
const utils = require('../utils');

const test = (context) => {
  const extraEnv = {};

  if (!global.argOpts['very-quiet']) {
    extraEnv.LOG_TO_STDOUT = 'true';
  }
  if (!global.argOpts.quiet && !global.argOpts['very-quiet']) {
    extraEnv.DETAILED_LOG_TO_STDOUT = 'true';
  }

  return utils.readCredentials()
    .then((credentials) => {
      extraEnv.ZAPIER_DEPLOY_KEY = credentials.deployKey;
    })
    .then(() => {
      const env = _.extend({}, process.env, extraEnv);
      return utils.runCommand('npm', ['run', '--silent', 'test'], {stdio: 'inherit', env})
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
  'very-quiet': {flag: true, help: 'do not print zapier summary or detail logs to standard out'}
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
