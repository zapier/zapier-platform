const colors = require('colors/safe');

const constants = require('../constants');
const utils = require('../utils');

const QUESTION_USERNAME = 'What is your Zapier login email address? (Ctrl-C to cancel)';
const QUESTION_PASSWORD = 'What is your Zapier login password?';
const login = (context) => {
  const checks = [
    utils.readCredentials()
      .then(() => true)
      .catch(() => false),
    utils.checkCredentials()
      .then(() => true)
      .catch(() => false)
  ];
  return Promise.all(checks)
    .then(([credentialsPresent, credentialsGood]) => {
      if (!credentialsPresent) {
        context.line(colors.yellow(`Your ${constants.AUTH_LOCATION} has not been set up yet.\n`));
      } else if (!credentialsGood) {
        context.line(colors.red(`Your ${constants.AUTH_LOCATION} looks like it has invalid credentials.\n`));
      } else {
        context.line(colors.green(`Your ${constants.AUTH_LOCATION} looks valid. You may update it now though.\n`));
      }
      return utils.getInput(QUESTION_USERNAME);
    })
    .then((username) => {
      return Promise.all([
        username,
        utils.getInput(QUESTION_PASSWORD, {secret: true})
      ]);
    })
    .then(([username, password]) => {
      return utils.createCredentials(username, password)
        .then((data) => data.key);
    })
    .then((deployKey) => {
      return utils.writeFile(constants.AUTH_LOCATION, utils.prettyJSONstringify({
        deployKey: deployKey
      }));
    })
    .then(utils.checkCredentials)
    .then(() => {
      context.line(`Your deploy key has been saved to ${constants.AUTH_LOCATION}. Now try \`zapier init .\` to start a new local app.`);
    });
};
login.argsSpec = [];
login.argOptsSpec = {};
login.help = `Configure your \`${constants.AUTH_LOCATION_RAW}\` with a deploy key.`;
login.example = 'zapier login';
login.docs = `
This is an interactive prompt which will create, retrieve and store a deploy key.

> This will change the  \`${constants.AUTH_LOCATION_RAW}\` (home directory identifies the deploy key & user).

${'```'}bash
$ zapier login
# ${QUESTION_USERNAME}
# ${QUESTION_PASSWORD}
#  <type here>
# Your deploy key has been saved to ${constants.AUTH_LOCATION_RAW}. Now try \`zapier init .\` to start a new local app.
${'```'}
`;

module.exports = login;
