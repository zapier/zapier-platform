/*eslint no-process-exit: 0 */
require('babel-polyfill');

const _ = require('lodash');
const colors = require('colors/safe');
const updateNotifier = require('update-notifier');

const {
  DEBUG,
  LAMBDA_VERSION,
  UPDATE_NOTIFICATION_INTERVAL
} = require('./constants');
const commands = require('./commands');
const utils = require('./utils');
const leven = require('leven');

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
        `Requires node version >= ${LAMBDA_VERSION}, found ${
          process.versions.node
        }. Please upgrade node.`
      )
    );
    process.exit(1);
  }

  const pkg = require('../package.json');
  const notifier = updateNotifier({
    pkg: pkg,
    updateCheckInterval: UPDATE_NOTIFICATION_INTERVAL
  });
  if (notifier.update && notifier.update.latest !== pkg.version) {
    notifier.notify({ isGlobal: true });
  }

  if (DEBUG) {
    console.log('running in:', process.cwd());
    console.log('raw argv:', argv);
    console.log('\n--------------------------------------------------\n\n');
  }

  argv = argv.slice(2); // strip path, zapier.js

  let [args, argOpts] = utils.argParse(argv);
  global.argOpts = argOpts;

  // when `zapier invitees --help`, swap to `zapier help invitees`
  if (argOpts.help || args.length === 0) {
    args = ['help'].concat(args);
  }

  const command = args[0];
  args = args.slice(1);

  // create the context, logs thread through this
  const context = utils.createContext({ command, args, argOpts });

  if (command === 'help' && (argOpts.version || argOpts.v)) {
    utils.printVersionInfo(context);
    return;
  }

  let commandFunc = commands[command];
  if (!commandFunc) {
    let message = [`\`zapier ${command}\` is not a command!`];
    const suggestion = commandSuggestion(command);
    if (suggestion) {
      message.push(`Did you mean \`zapier ${suggestion}\`?`);
    } else {
      message.push(
        'Run `zapier help` to see a full list of available commands.'
      );
    }

    context.line(message.join(' '));

    return;
  }

  const { valid, reason } = utils.isValidAppInstall(command);
  if (!valid) {
    console.error(colors.red(reason));
    process.exit(1);
  }

  const spec = {
    argsSpec: commandFunc.argsSpec,
    argOptsSpec: _.extend({}, utils.globalArgOptsSpec, commandFunc.argOptsSpec)
  };
  const errors = utils.enforceArgSpec(spec, args, argOpts);
  if (errors.length) {
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
    process.exit(1);
  }

  commandFunc(context, ...args).catch(err => {
    utils.endSpinner(false);

    if (DEBUG || global.argOpts.debug) {
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
    process.exit(1);
  });
};
