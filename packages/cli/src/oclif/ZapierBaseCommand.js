const { Command } = require('@oclif/command');

const { startSpinner, endSpinner, formatStyles } = require('../utils/display');

const inquirer = require('inquirer');

const DATA_FORMATS = ['json', 'raw'];

class ZapierBaseCommand extends Command {
  run() {
    this._parseFlags();
    if (this.flags.debug) {
      this.debug.enabled = true; // enables this.debug on the command
      require('debug').enable('zapier:*'); // enables all further spawned functions, like API
    }

    this.debug('args are', this.args);
    this.debug('flags are', this.flags);
    this.debug('------------');
    return this.perform();
  }

  _parseFlags() {
    const { flags, args } = this.parse(Object.getPrototypeOf(this).constructor);

    this.flags = flags;
    this.args = args;
  }

  perform() {
    this.error(`subclass the "perform" method in the "${this.id}" command`);
  }

  // UTILS
  log(...message) {
    if (this._shouldPrintData()) {
      this._forceLog(...message);
    }
  }

  // needed for printing in json mode
  _forceLog(...message) {
    super.log(...message);
  }

  /**
   * log data in table form
   * @param {Object} opts
   * @param {any[]} opts.rows The data to display
   * @param {string[][]} opts.headers Array of pairs of the column header and the key in the row that that header applies to
   * @param {string} opts.emptyMessage a message to print if there's no data
   * @param {boolean} opts.usedRowBasedTable override format and use `row` instead
   */
  logTable({
    rows = [],
    headers = [],
    emptyMessage = '',
    usedRowBasedTable = false
  } = {}) {
    const formatter = usedRowBasedTable
      ? formatStyles.row
      : formatStyles[this.flags.format];
    if (!formatter) {
      // throwing this error ensures that all commands that call this function take a format flag, since that provides the default
      this.error(`invalid table format: ${this.flags.format}`);
    }
    if (this._shouldPrintData()) {
      if (!rows.length) {
        this.log(emptyMessage);
      } else {
        this.log(formatter(rows, headers));
      }
    } else {
      this._forceLog(rows);
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

  /**
   * should only print to stdout when in a non-data mode
   */
  _shouldPrintData() {
    return this.flags.format && !DATA_FORMATS.includes(this.flags.format);
  }

  startSpinner(message) {
    startSpinner(message);
  }

  stopSpinner({ success = true, message = undefined } = {}) {
    endSpinner(success, message);
  }
}

module.exports = ZapierBaseCommand;
