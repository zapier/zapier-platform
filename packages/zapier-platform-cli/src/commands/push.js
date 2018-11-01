const _ = require('lodash');

const utils = require('../utils');
const constants = require('../constants');
const {
  maybeLogin,
  maybeRegisterApp
} = require('../utils/command-invocations');
const build = require('./build');

const push = context => {
  context.line('Preparing to build and upload your app.\n');

  return maybeLogin(context)
    .then(() => maybeRegisterApp(context))
    .then(() => utils.buildAndUploadDir())
    .then(() => {
      context.line(
        `\nBuild and upload complete! You should see it in your Zapier editor at ${
          constants.BASE_ENDPOINT
        }/app/editor now!`
      );
    });
};
push.argsSpec = [];
push.argOptsSpec = _.extend({}, build.argOptsSpec);
push.help = 'Build and upload the current app - does not promote.';
push.example = 'zapier push';
push.docs = `
A shortcut for \`zapier build && zapier upload\` - this is our recommended way to push an app. This is a common workflow:

1. Make changes in \`index.js\` or other files.
2. Run \`zapier test\`.
3. Run \`zapier push\`.
4. QA/experiment in the Zapier.com Zap editor.
5. Go to 1 and repeat.

> Note: this is always a safe operation as live/production apps are protected from pushes. You must use \`zapier promote\` or \`zapier migrate\` to impact live users.

> Note: this command will create (or overwrite) an AppVersion that matches the ones listed in your \`package.json\`. If you want to push to a new version, increment the "version" key in \`package.json\`.

If you have not yet registered your app, this command will prompt you for your app title and to register the app.

${'```'}bash
$ zapier push
# Preparing to build and upload app.
#
#   Copying project to temp directory - done!
#   Installing project dependencies - done!
#   Applying entry point file - done!
#   Validating project - done!
#   Building app definition.json - done!
#   Zipping project and dependencies - done!
#   Cleaning up temp directory - done!
#   Uploading version 1.0.0 - done!
#
# Build and upload complete! Try loading the Zapier editor now, or try \`zapier promote\` to put it into rotation or \`zapier migrate\` to move users over
${'```'}
`;

module.exports = push;
