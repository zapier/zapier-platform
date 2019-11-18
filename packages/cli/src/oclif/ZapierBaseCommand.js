const { Command } = require('@oclif/command');
const colors = require('colors/safe');

const { startSpinner, endSpinner, formatStyles } = require('../utils/display');
const { isValidAppInstall } = require('../utils/misc');
const { recordAnalytics } = require('../utils/analytics');

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

    this.throwForInvalidAppInstall();

    // the following comments are pre-merge, might be out of date:

    // If the `perform` errors out, then we never see the analytics response. We also run the risk of not having the chance to fire them off at all
    // would need to catch errors in the perform so that they're not thrown until the whole chain finishes
    // also, would be nice to plug into something a little more base-level so we catch invalid flags. Not super important

    return Promise.all([
      this._recordAnalytics(),

      this.perform().catch(e => {
        this.stopSpinner({ success: false });
        const errTextLines = [e.message];

        this.debug(e.stack);

        if (!this.flags.debug && !this.flags.invokedFromAnotherCommand) {
          errTextLines.push(
            colors.gray('re-run this command with `--debug` for more info')
          );
        }

        this.error(errTextLines.join('\n\n'));
      })
    ]);
  }

  _parseFlags() {
    const { flags, args } = this.parse(Object.getPrototypeOf(this).constructor);

    this.flags = flags;
    this.args = args;
  }

  perform() {
    this.error(`subclass the "perform" method in the "${this.id}" command`);
  }

  // ; put ina method so we can disable it easily in tests
  throwForInvalidAppInstall() {
    const { valid, reason } = isValidAppInstall(this.id);
    if (!valid) {
      this.error(reason);
    }
  }

  // UTILS
  /**
   * Helps us not have helpful UI messages when the whole output should only be JSON.
   * @param  {...any} message the joined string to print out
   */
  log(...message) {
    if (this._shouldPrintData()) {
      super.log(...message);
    }
  }

  // we may not end up needing this
  logJSON(o) {
    if (typeof o === 'string') {
      console.log(o);
    } else {
      console.log(JSON.stringify(o, null, 2));
    }
  }

  /**
   * log data in table form
   * @param {Object} opts
   * @param {any[]} opts.rows The data to display
   * @param {string[][]} opts.headers Array of pairs of the column header and the key in the row that that header applies to
   * @param {string} opts.emptyMessage a message to print if there's no data. Printed in grey
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
    if (!rows.length && this._shouldPrintData()) {
      this.log(colors.gray(emptyMessage));
    } else {
      // data comes out of the formatter ready to be printed (and it's always in the type to match the format) so we don't need to do anything special with it
      console.log(formatter(rows, headers));
    }
  }

  /**
   * get user input
   * @param {string} question the question to ask the user
   * @param {object} opts `inquierer.js` opts ([read more](https://github.com/SBoudrias/Inquirer.js/#question))
   */
  async prompt(question, opts = {}) {
    const { ans } = await inquirer.prompt({
      type: 'string',
      ...opts,
      name: 'ans',
      message: question
    });
    return ans;
  }

  promptHidden(question) {
    return this.prompt(question, {
      type: 'password',
      mask: true
    });
  }

  confirm(message, defaultAns = false, showCtrlC = false) {
    if (showCtrlC) {
      message += ' (Ctrl-C to cancel)';
    }
    return this.prompt(message, { default: defaultAns, type: 'confirm' });
  }

  /**
   * should only print to stdout when in a non-data mode
   */
  _shouldPrintData() {
    return !this.flags.format || !DATA_FORMATS.includes(this.flags.format);
  }

  startSpinner(message) {
    startSpinner(message);
  }

  stopSpinner({ success = true, message = undefined } = {}) {
    endSpinner(success, message);
  }

  // pulled from https://github.com/oclif/plugin-help/blob/73bfd5a861e65844a1d6c3a0a9638ee49d16fee8/src/command.ts
  // renamed to avoid naming collision
  static zUsage(name) {
    const formatArg = arg => {
      const argName = arg.name.toUpperCase();
      return arg.required ? argName : `[${argName}]`;
    };

    return [
      'zapier',
      name,
      ...(this.args || []).filter(a => !a.hidden).map(a => formatArg(a))
    ].join(' ');
  }

  // this is fine for now but we'll want to hack into https://github.com/oclif/plugin-help/blob/master/src/command.ts at some point
  // the presentation is wrapped into the formatting, so it's a little tough to pull out
  static markdownHelp(name) {
    const formattedArgs = () =>
      this.args.map(arg =>
        arg.hidden
          ? null
          : `* ${arg.required ? '(required) ' : ''}\`${arg.name}\` | ${
              arg.description
            }`
      );
    const formattedFlags = () =>
      Object.entries(this.flags)
        .map(([longName, flag]) =>
          flag.hidden
            ? null
            : `* ${flag.required ? '(required) ' : ''}\`${
                flag.char ? `-${flag.char}, ` : ''
              }--${longName}\` | ${flag.description} ${
                flag.options ? `One of \`[${flag.options.join(' | ')}]\`.` : ''
              }${flag.default ? ` Defaults to \`${flag.default}\`.` : ''}
      `.trim()
        )
        .filter(Boolean);

    const descriptionParts = this.description.split('\n').filter(Boolean);
    const blurb = descriptionParts[0];
    const lengthyDescription = colors.stripColors(
      descriptionParts.length > 1 ? descriptionParts.slice(1).join('\n\n') : ''
    );

    return [
      `## ${name}`,
      '',
      `> ${blurb}`,
      '',
      `**Usage**: \`${this.zUsage(name)}\``,
      ...(lengthyDescription ? ['', lengthyDescription] : []),
      ...(this.args ? ['', '**Arguments**', ...formattedArgs()] : []),
      ...(this.flags ? ['', '**Flags**', ...formattedFlags()] : []),
      ...(this.examples
        ? ['', '**Examples**', this.examples.map(e => `* \`${e}\``).join('\n')]
        : [])
    ]
      .join('\n')
      .trim();
  }

  _recordAnalytics() {
    // if we got here, the command must be true
    if (!this.args) {
      throw new Error('unable to record analytics until args are parsed');
    }
    return recordAnalytics(this.id, true, Object.keys(this.args), this.flags);
  }
}

module.exports = ZapierBaseCommand;
