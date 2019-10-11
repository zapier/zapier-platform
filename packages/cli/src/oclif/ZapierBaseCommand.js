const { Command } = require('@oclif/command');

const { startSpinner, endSpinner } = require('../utils/display');
const { recordAnalytics } = require('../utils/analytics');

const inquirer = require('inquirer');

class ZapierBaseCommand extends Command {
  run() {
    this._parseFlags();
    return Promise.all([
      // probably need to tweak this so that if the command fails, the analytics aren't rejected?
      recordAnalytics(this.id, true, Object.keys(this.args), this.flags),
      this.perform()
    ]);
  }

  _parseFlags() {
    const { flags, args } = this.parse(Object.getPrototypeOf(this).constructor);

    this.flags = flags;
    this.args = args;
  }

  perform() {
    throw new Error('subclass me');
  }

  // UTILS
  log(...message) {
    if (!['json', 'raw'].includes(this.flags.format)) {
      super.log(...message);
    }
  }

  async confirm(message, defaultAns = false) {
    const { ans } = await inquirer.prompt({
      type: 'confirm',
      message,
      default: defaultAns,
      name: 'ans'
    });
    return ans;
  }

  startSpinner(message) {
    startSpinner(message);
  }

  stopSpinner({ success = true, message = undefined } = {}) {
    endSpinner(success, message);
  }
}

module.exports = ZapierBaseCommand;
