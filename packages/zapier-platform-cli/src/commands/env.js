const fs = require('fs');
const utils = require('../utils');

const env = (context, version, key, value) => {
  const isRemove = global.argOpts.remove;

  if (value !== undefined || isRemove) {
    key = key.toUpperCase();
    return utils.checkCredentials()
      .then(() => utils.getLinkedApp())
      .then((app) => {
        const url = `/apps/${app.id}/versions/${version}/environment/${key}`;
        const verb = isRemove ? 'remove' : 'set';

        context.line(`Preparing to ${verb} environment ${key} for your ${version} "${app.title}".\n`);

        const startMsg = isRemove ? `Deleting ${key}` : `Setting ${key} to "${value}"`;
        utils.printStarting(startMsg);

        const method = isRemove ? 'DELETE' : 'PUT';
        return utils.callAPI(url, {
          method,
          body: value
        });
      })
      .then(() => {
        utils.printDone();
        context.line();
        context.line(`Environment updated! Try viewing it with \`zapier env ${version}\`.`);

        // touch index.js to force watch to pick up env changes
        fs.utimesSync(utils.entryPoint(), NaN, NaN);

        return;
      });
  }
  if (key) {
    context.line(`Try viewing your env with \`zapier env\` or setting with \`${env.example}\`.`);
    return Promise.resolve();
  }
  return utils.listEnv(version)
    .then((data) => {
      context.line(`The env of your "${data.app.title}" listed below.\n`);
      utils.printData(data.environment, [
        ['Version', 'app_version'],
        ['Key', 'key'],
        ['Value', 'value'],
      ]);
      context.line(`\nTry setting an env with the \`${env.example}\` command.`);
    });
};
env.argsSpec = [
  {name: 'version', example: '1.0.0', required: true, help: 'the app version\'s environment to work on'},
  {name: 'key', example: 'CLIENT_SECRET', help: 'the uppercase key of the environment variable to set'},
  {name: 'value', example: '12345', help: 'the raw value to set to the key'},
];
env.argOptsSpec = {
  remove: {flag: true, help: 'optionally remove environment variable with this key'}
};
env.help = 'Read, write, and delete environment variables.';
env.example = 'zapier env 1.0.0 CLIENT_SECRET 12345';
env.docs = `
Manage the environment of your app so that \`process.env\` has the necessary variables, making it easy to match a local environment with a production environment via \`CLIENT_SECRET=12345 zapier test\`.

**Arguments**

${utils.argsFragment(env.argsSpec)}
${utils.argOptsFragment(env.argOptsSpec)}
${utils.defaultArgOptsFragment()}

${'```'}bash
$ zapier env 1.0.0
# The env of your "Example" listed below.
#
# ┌─────────┬───────────────┬───────┐
# │ Version │ Key           │ Value │
# ├─────────┼───────────────┼───────┤
# │ 1.0.0   │ CLIENT_SECRET │ 12345 │
# └─────────┴───────────────┴───────┘
#
# Try setting an env with the \`zapier env 1.0.0 CLIENT_SECRET 12345\` command.

$ zapier env 1.0.0 CLIENT_SECRET 12345
# Preparing to set environment CLIENT_SECRET for your 1.0.0 "Example".
#
#   Setting CLIENT_SECRET to "12345" - done!
#
# Environment updated! Try viewing it with \`zapier env 1.0.0\`.

$ zapier env 1.0.0 CLIENT_SECRET --remove
# Preparing to remove environment CLIENT_SECRET for your 1.0.0 "Example".
#
#   Deleting CLIENT_SECRET - done!
#
# Environment updated! Try viewing it with \`zapier env 1.0.0\`.
${'```'}
`;

module.exports = env;
