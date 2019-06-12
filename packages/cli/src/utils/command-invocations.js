// this is explicitly left out of utils/index because it creates a circular dependency
// this file can't be used in any of the required commands

const login = require('../commands/login');
const register = require('../commands/register');

const { readCredentials, getLinkedAppConfig } = require('./api');
const { getInput } = require('./display');
const _ = require('lodash');

// check if the user needs to be logged in and do it if so
// returns a promise
const maybeLogin = context => {
  return readCredentials(false).then(creds => {
    if (_.isEmpty(creds)) {
      context.line('Before you can do that, you need to be logged in.\n');
      return login(context, false);
    } else {
      return Promise.resolve();
    }
  });
};

const hasRegisteredApp = async () => {
  try {
    const app = await getLinkedAppConfig();
    return Boolean(app.id);
  } catch (err) {
    return false;
  }
};

// check if the user needs to be registered in and do it if so
// returns a promise
const maybeRegisterApp = async context => {
  if (!await hasRegisteredApp()) {
    context.line(
      "Looks like this is your first push. Let's register your app on Zapier."
    );
    const title = await getInput('Enter app title (Ctrl-C to cancel):\n\n  ');
    await register(context, title, { printWhenDone: false });
  }
};

module.exports = {
  maybeLogin,
  maybeRegisterApp
};
