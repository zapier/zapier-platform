const constants = require('../constants');
const utils = require('../utils');

const hasCancelled = answer => (
  answer.toLowerCase() === 'no' || answer.toLowerCase() === 'cancel'
);

const pickApp = (context, apps, appMap) => {
  if (!apps.length) {
    throw new Error('You don\'t seem to have any CLI apps. Make sure you\'re invited to one, or create one first.');
  }

  utils.printData(apps, [
    ['#', 'number'],
    ['Title', 'title'],
    ['Unique Key', 'key'],
    ['Timestamp', 'date'],
    ['Linked', 'linked'],
  ]);

  const action = () => utils.getInput('Which app number do you want to link? (Ctrl-C to cancel)\n\n');
  const stop = (answer) => {
    if (!hasCancelled(answer) && !appMap[answer]) {
      throw new Error('That app number does not match any CLI app that you have access to.');
    }

    return appMap[answer] || hasCancelled(answer);
  };

  return utils.promiseDoWhile(action, stop);
};

const link = (context) => {
  let appMap = {};

  return utils.listApps()
    .then((data) => {
      const apps = data.apps.map((app, index, arr) => {
        app.number = arr.length - index;
        appMap[app.number] = app;
        return app;
      });
      return pickApp(context, apps, appMap);
    })
    .then((answer) => {
      context.line();
      if (hasCancelled(answer)) {
        throw new Error('Cancelled link operation.');
      } else {
        utils.printStarting(`Selecting existing app "${appMap[answer].title}"`);
        return appMap[answer];
      }
    })
    .then((app) => {
      utils.printDone();
      utils.printStarting(`Setting up \`${constants.CURRENT_APP_FILE}\` file`);
      return utils.writeLinkedAppConfig(app);
    })
    .then(() => {
      utils.printDone();
      context.line('\nFinished! You can `zapier push` now to build & upload a version!');
    });
};
link.argsSpec = [];
link.argOptsSpec = {};
link.help = 'Link the current directory to an app you have access to.';
link.example = 'zapier link';
link.docs = `
Link the current directory to an app you have access to. It is fairly uncommon to run this command - more often you'd just \`git clone git@github.com:example-inc/example.git\` which would have a \`${constants.CURRENT_APP_FILE}\` file already included. If not, you'd need to be an admin on the app and use this command to regenerate the \`${constants.CURRENT_APP_FILE}\` file.

Or, if you are making an app from scratch - you should prefer \`zapier init\`.

> This will change the \`./${constants.CURRENT_APP_FILE}\` (which identifies the app assosciated with the current directory).

**Arguments**

${utils.argsFragment(link.argsSpec)}
${utils.argOptsFragment(link.argOptsSpec)}
${utils.defaultArgOptsFragment()}

${'```'}bash
$ zapier link
# Which app would you like to link the current directory to?
#
# ┌────────┬─────────────┬────────────┬─────────────────────┬────────┐
# │ Number │ Title       │ Unique Key │ Timestamp           │ Linked │
# ├────────┼─────────────┼────────────┼─────────────────────┼────────┤
# │ 1      │ Example     │ Example    │ 2016-01-01T22:19:28 │ ✔      │
# └────────┴─────────────┴────────────┴─────────────────────┴────────┘
#      ...or type any title to create new app!
#
# Which app number do you want to link? You also may type a new app title to create one. (Ctrl-C to cancel)
#
  1
#
#   Selecting existing app "Example" - done!
#   Setting up \`${constants.CURRENT_APP_FILE}\` file - done!
#
# Finished! You can \`zapier push\` now to build & upload a version!
${'```'}
`;

module.exports = link;
