const { Command } = require('@oclif/core');
const colors = require('colors/safe');

const { startSpinner, endSpinner, formatStyles } = require('../utils/display');
const { isValidAppInstall } = require('../utils/misc');
const { recordAnalytics } = require('../utils/analytics');

const { getWritableApp } = require('../utils/api');

const inquirer = require('inquirer');

const DATA_FORMATS = ['json', 'raw'];

class ZapierBaseCommand extends Command {
  async run() {
    this._initPromptModules();
    await this._parseCommand();

    if (this.flags.debug) {
      this.debug.enabled = true; // enables this.debug on the command
      require('debug').enable('zapier:*,oclif:zapier:*'); // enables all further spawned functions, like API
    }

    this.debug('argv is', this.argv);
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

      this.perform().catch((e) => {
        this.stopSpinner({ success: false });
        const errTextLines = [e.message];

        this.debug(e.stack);

        if (!this.flags.debug && !this.flags.invokedFromAnotherCommand) {
          errTextLines.push(
            colors.gray('re-run this command with `--debug` for more info'),
          );
        }

        this.error(errTextLines.join('\n\n'));
      }),
    ]);
  }

  get _staticClassReference() {
    return Object.getPrototypeOf(this).constructor;
  }

  _initPromptModules() {
    this._stdoutPrompt = inquirer.prompt;
    this._stderrPrompt = inquirer.createPromptModule({
      output: process.stderr,
    });
  }

  async _parseCommand() {
    const { flags, args, argv } = await this.parse(this._staticClassReference);

    this.flags = flags;
    this.args = args;
    this.argv = argv;
  }

  perform() {
    this.error(`subclass the "perform" method in the "${this.id}" command`);
  }

  // put ina method so we can disable it easily in tests
  throwForInvalidAppInstall() {
    if (this._staticClassReference.skipValidInstallCheck) {
      return;
    }
    const { valid, reason } = isValidAppInstall();
    if (!valid) {
      this.error(reason);
    }
  }

  // validate that user input looks like a semver version
  throwForInvalidVersion(version) {
    if (
      !version.match(
        /^(0|[1-9]\d{,2})\.(0|[1-9]\d{,2})\.(0|[1-9]\d{,2})(-[0-9A-Za-z]+)*$/g,
      )
    ) {
      throw new Error(
        `${version} is an invalid version str. Try something like \`1.2.3\``,
      );
    }
  }

  async getWritableApp() {
    this.startSpinner('Checking authentication & permissions');
    const app = await getWritableApp();
    this.stopSpinner();
    return app;
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

  logJSON(o) {
    if (typeof o === 'string') {
      console.log(o);
    } else {
      console.log(JSON.stringify(o, null, 2));
    }
  }

  /**
   * log data in table form. Headers are `[header, key]`
   * @param {Object} opts
   * @param {any[]} opts.rows The data to display
   * @param {string[][]} opts.headers Array of pairs of the column header and the key in the row that that header applies to
   * @param {string} opts.emptyMessage a message to print if there's no data. Printed in grey
   * @param {boolean} opts.formatOverride override format and use this instead
   */
  logTable({
    rows = [],
    headers = [],
    emptyMessage = '',
    formatOverride = '',
    hasBorder = true,
    showHeaders = true,
    style = undefined,
  } = {}) {
    const formatter = formatOverride
      ? formatStyles[formatOverride]
      : formatStyles[this.flags.format];
    if (!formatter) {
      // throwing this error ensures that all commands that call this function take a format flag, since that provides the default
      this.error(`invalid table format: ${this.flags.format}`);
    }
    if (!rows.length && this._shouldPrintData()) {
      this.log(colors.gray(emptyMessage));
    } else {
      // data comes out of the formatter ready to be printed (and it's always in the type to match the format) so we don't need to do anything special with it
      console.log(formatter(rows, headers, showHeaders, hasBorder, style));
    }
  }

  /**
   *
   * @param {Object} opts options object (as expected for this.prompt())
   * @returns {string|boolean} Boolean if validation passes, string w/ error message if it doesn't
   */
  _getCustomValidatation(opts) {
    return (input) => {
      const validators = {
        required: (input) =>
          input.trim() === '' ? 'This field is required.' : true,
        charLimit: (input, charLimit) =>
          input.length > charLimit
            ? `Please provide a value ${charLimit} characters or less.`
            : true,
        charMinimum: (input, charMinimum) =>
          input.length < charMinimum
            ? `Please provide a value ${charMinimum} characters or more.`
            : true,
      };
      let aggregateResult = true;

      for (const key in opts) {
        if (typeof validators[key] === 'undefined') {
          continue;
        }

        let individualResult;
        if (validators[key].length > 1) {
          individualResult = validators[key](input, opts[key]);
        } else {
          individualResult = validators[key](input);
        }

        if (individualResult !== true) {
          aggregateResult = individualResult;
          break;
        }
      }

      return aggregateResult;
    };
  }

  /**
   * get user input
   * @param {string} question the question to ask the user
   * @param {object} opts `inquierer.js` opts ([read more](https://github.com/SBoudrias/Inquirer.js/#question))
   */
  async prompt(question, opts = {}) {
    if (Object.keys(opts).length) {
      opts.validate = this._getCustomValidatation(opts);
    }
    const prompt = opts.useStderr ? this._stderrPrompt : this._stdoutPrompt;
    const { ans } = await prompt({
      type: 'string',
      ...opts,
      name: 'ans',
      message: question,
    });
    return ans;
  }

  promptHidden(question, useStderr = false) {
    return this.prompt(question, {
      type: 'password',
      mask: true,
      useStderr,
    });
  }

  confirm(message, defaultAns = false, showCtrlC = false, useStderr = false) {
    if (showCtrlC) {
      message += ' (Ctrl-C to cancel)';
    }
    return this.prompt(message, {
      default: defaultAns,
      type: 'confirm',
      useStderr,
    });
  }

  // see here for options for choices: https://github.com/SBoudrias/Inquirer.js/#question
  promptWithList(question, choices, additionalOpts) {
    return this.prompt(question, { type: 'list', choices, ...additionalOpts });
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
    const formatArg = (arg) => {
      const argName = arg.name.toUpperCase();
      return arg.required ? argName : `[${argName}]`;
    };

    const argv = Object.entries(this.args ?? {}).map(([argName, argValue]) => ({
      name: argName,
      ...argValue,
    }));
    const visibleArgv = argv.filter((arg) => !arg.hidden);

    return ['zapier', name, ...visibleArgv.map(formatArg)].join(' ');
  }

  // this is fine for now but we'll want to hack into https://github.com/oclif/plugin-help/blob/master/src/command.ts at some point
  // the presentation is wrapped into the formatting, so it's a little tough to pull out
  static markdownHelp(name) {
    const getFormattedArgs = () =>
      Object.keys(this.args ?? {}).map((argName) => {
        const arg = this.args[argName];
        return arg.hidden
          ? null
          : `* ${arg.required ? '(required) ' : ''}\`${argName}\` | ${
              arg.description
            }`;
      });
    const getFormattedFlags = () =>
      Object.entries(this.flags)
        .map(([flagName, flagValue]) =>
          flagValue.hidden
            ? null
            : `* ${flagValue.required ? '(required) ' : ''}\`${
                flagValue.char ? `-${flagValue.char}, ` : ''
              }--${flagName}\` |${
                flagValue.description ? ` ${flagValue.description}` : ''
              } ${
                flagValue.options
                  ? `One of \`[${flagValue.options.join(' | ')}]\`.`
                  : ''
              }${
                flagValue.default
                  ? ` Defaults to \`${flagValue.default}\`.`
                  : ''
              }
      `.trim(),
        )
        .filter(Boolean);

    const descriptionParts = this.description.split('\n\n').filter(Boolean);
    const blurb = descriptionParts[0];
    const lengthyDescription = colors.stripColors(
      descriptionParts.length > 1 ? descriptionParts.slice(1).join('\n\n') : '',
    );

    return [
      `## ${name}`,
      '',
      `> ${blurb}`,
      '',
      `**Usage**: \`${this.zUsage(name)}\``,
      ...(lengthyDescription ? ['', lengthyDescription] : []),
      ...(Object.keys(this.args ?? {}).length
        ? ['', '**Arguments**', ...getFormattedArgs()]
        : []),
      ...(Object.keys(this.flags ?? {}).length
        ? ['', '**Flags**', ...getFormattedFlags()]
        : []),
      ...((this.examples ?? []).length
        ? [
            '',
            '**Examples**',
            this.examples.map((e) => `* \`${e}\``).join('\n'),
          ]
        : []),
      ...((this.aliases ?? []).length
        ? ['', '**Aliases**', this.aliases.map((e) => `* \`${e}\``).join('\n')]
        : []),
    ]
      .join('\n')
      .trim();
  }

  _recordAnalytics() {
    // if we got here, the command must be valid
    if (!this.args) {
      throw new Error('unable to record analytics until args are parsed');
    }
    return recordAnalytics(this.id, true, this.args, this.flags);
  }
}

ZapierBaseCommand.skipValidInstallCheck = false;

module.exports = ZapierBaseCommand;
