// this is explicitly left out of utils/index because it creates a circular dependency
// this file can't be used in any of the required commands

const login = require('../commands/login');
const register = require('../commands/register');

const { readCredentials } = require('./api');
const { fileExistsSync } = require('./files');
const { getInput } = require('./display');
const _ = require('lodash');
const constants = require('../constants');

// check if the user needs to be logged in and do it if so
// returns a promise
const maybeLogin = context => {
  return readCredentials(null, false).then(creds => {
    if (_.isEmpty(creds)) {
      context.line('Before you can do that, you need to be logged in.\n');
      return login(context, false);
    } else {
      return Promise.resolve();
    }
  });
};

// check if the user needs to be registered in and do it if so
// returns a promise
const maybeRegisterApp = context => {
  if (!fileExistsSync(constants.CURRENT_APP_FILE)) {
    context.line(
      "Looks like this is your first push. Let's register your app on Zapier."
    );
    return getInput('Enter app title (Ctrl-C to cancel):\n\n  ').then(title =>
      register(context, title, { printWhenDone: false })
    );
  } else {
    return Promise.resolve();
  }
};

module.exports = {
  maybeLogin,
  maybeRegisterApp
};
