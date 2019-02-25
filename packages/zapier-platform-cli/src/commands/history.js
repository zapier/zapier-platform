const utils = require('../utils');

const history = context => {
  return utils.listHistory().then(data => {
    context.line(`The history of your app "${data.app.title}" listed below.\n`);
    utils.printData(data.history, [
      ['What', 'action'],
      ['Message', 'message'],
      ['Who', 'customuser'],
      ['Timestamp', 'date']
    ]);
  });
};
history.argsSpec = [];
history.argOptsSpec = {};
history.help = 'Prints all edit history for your app.';
history.example = 'zapier history';
history.docs = `
Get the history of your app, listing all the changes made over the lifetime of your app. This includes everything from creation, updates, migrations, admins and invitee changes as well as who made the change and when.

**Arguments**

${utils.argsFragment(history.argsSpec)}
${utils.argOptsFragment(history.argOptsSpec)}
${utils.defaultArgOptsFragment()}

${'```'}bash
$ zapier history
# The history of your app "Example" listed below.
#
# ┌──────────────────────────┬───────────────────┬──────────────────┬─────────────────────┐
# │ What                     │ Message           │ Who              │ Timestamp           │
# ├──────────────────────────┼───────────────────┼──────────────────┼─────────────────────┤
# │ admin added              │ other@example.com │ user@example.com │ 2016-01-10T16:12:33 │
# │ environment variable set │ CLIENT_SECRET     │ user@example.com │ 2016-01-01T22:51:01 │
# │ version added            │ 1.2.52            │ user@example.com │ 2016-01-01T22:19:36 │
# │ app created              │ initial creation  │ user@example.com │ 2016-01-01T22:19:28 │
# └──────────────────────────┴───────────────────┴──────────────────┴─────────────────────┘
${'```'}
`;

module.exports = history;
