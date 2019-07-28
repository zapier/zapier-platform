const { Command, flags: Flags } = require('@oclif/command');
const { isEmpty } = require('lodash');
const { cli: ux } = require('cli-ux');

const { readCredentials, checkCredentials } = require('./utils/api');

class ZapierBaseCommand extends Command {
  _version() {
    return 'blah blah ok'; // this should overwrite the version string, but doesn't?
  }

  log(message) {
    if (!['json', 'raw'].includes(this.flags.format)) {
      super.log(message || '');
    }
  }

  get prompt() {
    return ux.prompt;
  }
  // AUTH
  /**
   * ensures credential file exists and looks correct. Doesn't guarantee creds are still valid, but the API call will blow up if that's the case. Cheap way to test early that user has a session
   */
  async probablyLoggedIn() {
    const creds = readCredentials(false);
    if (isEmpty(creds)) {
      this.log('Before you can do that, you need to be logged in.\n');
      // run login command, which we can't call from here since it'll eventually import this?
      this.login();
    }
  }

  /**
   * verifies creds, helpful to call before putting the user through tedious input fields and expensive operations (like build)
   */
  async definitelyLoggedIn() {
    try {
      await checkCredentials();
    } catch (e) {
      this.log('Credentials invalid, please run `zapier login`');
    }
  }

  // // this should really live on the command itself?
  // // but i'm not sure how to organize that code and take advantage of the utils in oclif
  // // or, we have instructions to run `zapier login` instead of actually piping them into it, simplifying our life
  // async login(firstTime = true) {
  //   // check credentials
  //   // get a lot of user input using this.prompt
  // }

  // async registerApp(title, printWhenDone = true) {
  //   await this.probablyLoggedIn();
  // }
}

ZapierBaseCommand.flags = {
  format: Flags.string({
    char: 'f',
    options: ['a', 'b', 'c', 'raw'],
    default: 'b'
  })
};

ZapierBaseCommand.buildFlags = childFlags =>
  Object.assign({}, childFlags, ZapierBaseCommand.flags);

module.exports = ZapierBaseCommand;
