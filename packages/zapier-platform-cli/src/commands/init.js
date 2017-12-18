const utils = require('../utils');
const exampleApps = require('../utils/example-apps');
const constants = require('../constants');
const appTemplates = require('../app-templates');

const init = (context, location) => {
  context.line('Welcome to the Zapier Platform! :-D');
  context.line();
  context.line(constants.ART);
  context.line();
  context.line("Let's initialize your app!");
  context.line();

  const template = global.argOpts.template || 'minimal';
  const createApp = tempAppDir => {
    utils.printStarting(
      `Downloading zapier/zapier-platform-example-app-${template} starter app`
    );
    return exampleApps
      .downloadAndUnzipTo(template, tempAppDir)
      .then(() => exampleApps.removeReadme(tempAppDir))
      .then(() => utils.printDone());
  };

  return utils.initApp(context, location, createApp).then(() => {
    context.line(
      '\nFinished! You might need to `npm install` then try `zapier test`!'
    );
  });
};

init.argsSpec = [{ name: 'path', required: true }];
init.argOptsSpec = {
  template: {
    help: 'select a starting app template',
    choices: appTemplates,
    default: 'minimal'
  }
};
init.help = 'Initializes a new Zapier app in a directory.';
init.example = 'zapier init path';
init.docs = `
Initializes a new Zapier app. If you specify a template, will download and install the app from that template.

After running this, you'll have a new example app in your directory. If you re-run this command on an existing directory it will leave existing files alone and not clobber them.

> Note: this doesn't register or deploy the app with Zapier - try \`zapier register "Example"\` and \`zapier push\` for that!

**Arguments**

${utils.argsFragment(init.argsSpec)}
${utils.argOptsFragment(init.argOptsSpec)}

${'```'}bash
$ zapier init example-app --template=minimal
# Let's initialize your app!
#
#   Downloading zapier/zapier-platform-example-app-minimal starter app - done!
#   Copy /users/username/code/example-app/.gitignore - done!
#   Copy /users/username/code/example-app/index.js - done!
#   Copy /users/username/code/example-app/package.json - done!
#   Copy /users/username/code/example-app/test/index.js - done!
#
# Finished! You might need to \`npm install\` then try \`zapier test\`!
${'```'}
`;

module.exports = init;
