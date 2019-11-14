/* eslint no-process-exit: 0 */
const _ = require('lodash');
const colors = require('colors/safe');
const updateNotifier = require('update-notifier');

const pkg = require('../package.json');

const { LAMBDA_VERSION, UPDATE_NOTIFICATION_INTERVAL } = require('./constants');
const commands = require('./commands');
const oCommands = require('./oclif/oCommands');
const utils = require('./utils');
const { recordAnalytics } = require('./utils/analytics');
const leven = require('leven');

const oclifCommands = new Set(Object.keys(oCommands));

const commandSuggestion = command => {
  const availableCommands = Object.keys(commands);
  // the lower the score, the more identical the words
  const suggestion = _.sortBy(
    availableCommands.map(c => {
      return { command: c, score: leven(command, c) };
    }),
    'score'
  )[0];

  // after some brief testing, ~3 is a reasonable threshold for a typo vs an unrelated word
  if (suggestion.score <= 3) {
    return suggestion.command;
  } else {
    return null;
  }
};

module.exports = argv => {
  if (!utils.isValidNodeVersion()) {
    console.error(
      colors.red(
        `Requires node version >= ${LAMBDA_VERSION}, found ${process.versions.node}. Please upgrade node.`
      )
    );
    process.exitCode = 1;
    return;
  }

  const notifier = updateNotifier({
    pkg,
    updateCheckInterval: UPDATE_NOTIFICATION_INTERVAL
  });
  if (notifier.update && notifier.update.latest !== pkg.version) {
    notifier.notify({ isGlobal: true });
  }

  argv = argv.slice(2); // strip path, zapier.js

  let [args, argOpts] = utils.argParse(argv);
  global.argOpts = argOpts;

  // when `zapier invitees --help`, swap to `zapier help invitees`
  if (argOpts.help || args.length === 0) {
    args = ['help'].concat(args);
  }

  const command = (args[0] || '').split(':')[0]; // accounts for subcommands
  args = args.slice(1);

  if (
    oclifCommands.has(command) || // zapier blah
    (command === 'help' && oclifCommands.has(args[0])) // zapier help blah
  ) {
    global.argOpts = undefined; // prevent mixing the new and the old
    require('./bin/run'); // requiring shouldn't have side effects, but this one is temporary and special
    return;
  }

  const analyticsPromise = recordAnalytics(
    command,
    Boolean(oclifCommands.has(command) || commands[command]),
    args,
    argOpts
  );

  // create the context, logs thread through this
  const context = utils.createContext({ command, args, argOpts });

  if (command === 'help' && (argOpts.version || argOpts.v)) {
    utils.printVersionInfo(context);
    return;
  }

  const commandFunc = commands[command];
  if (!commandFunc) {
    const message = [`\`zapier ${command}\` is not a command!`];
    const suggestion = commandSuggestion(command);
    if (suggestion) {
      message.push(`Did you mean \`zapier ${suggestion}\`?`);
    } else {
      message.push(
        'Run `zapier help` to see a full list of available commands.'
      );
    }

    context.line(message.join(' '));
    process.exitCode = 1;
    return;
  }

  const { valid, reason } = utils.isValidAppInstall(command);
  if (!valid) {
    // wait here, because it looks weird to print the "missing install" message and then wait another second
    analyticsPromise.then(() => {
      console.error(colors.red(reason));
      process.exitCode = 1;
    });
    return;
  }

  const spec = {
    argsSpec: commandFunc.argsSpec,
    argOptsSpec: _.extend({}, utils.globalArgOptsSpec, commandFunc.argOptsSpec)
  };
  const errors = utils.enforceArgSpec(spec, args, argOpts);
  if (errors.length) {
    // wait here, because it looks weird to print the "wrong flag" message and then wait another second
    analyticsPromise.then(() => {
      context.line();
      context.line(
        colors.red(
          'Errors running command `' + ['zapier'].concat(argv).join(' ') + '`:'
        )
      );
      context.line();
      errors.forEach(error => context.line(colors.red(`!!!   ${error}`)));
      context.line();
      context.line(`For more information, run \`zapier help ${command}\`.`);
      context.line();
      process.exitCode = 1;
    });
    return;
  }

  commandFunc(context, ...args).catch(err => {
    analyticsPromise.then(() => {
      utils.endSpinner(false);

      if (global.argOpts.debug) {
        context.line();
        context.line(err.stack);
        context.line();
        context.line(colors.red('Error!'));
      } else {
        context.line();
        context.line();
        context.line(colors.red('Error!') + ' ' + colors.red(err.message));
        context.line(
          colors.grey(
            '(Use --debug flag and run this command again to get more details.)'
          )
        );
      }
      process.exitCode = 1;
    });
  });
};
