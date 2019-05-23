#!/usr/bin/env node

const _ = require('lodash');
const path = require('path');

const commandsIndex = require('../src/commands/index');
const convertUtils = require('../src/utils/convert');
const renderTemplate = convertUtils.renderTemplate;

const allCommands = _.reduce(
  Object.keys(commandsIndex),
  (all, name) => {
    const cmd = commandsIndex[name];
    all.push({
      name,
      help: cmd.help,
      argOptsSpec: cmd.argOptsSpec,
      hide: cmd.hide
    });
    return all;
  },
  []
);

const commands = _.filter(allCommands, cmd => !cmd.hide);

const commandNames = commands.map(cmd => cmd.name);

const commandsWithOpts = _.filter(commands, cmd => !_.isEmpty(cmd.argOptsSpec));

const optsCases = _.map(commandsWithOpts, cmd => {
  const opts = _.map(cmd.argOptsSpec, (spec, opt) => `--${opt}`);
  return `            ${cmd.name})
                COMPREPLY=( $( compgen -W "${opts.join(' ')}" -- $cur ) )
               ;;`;
});

const templateFile = path.resolve(__dirname, '_zapier_bash.template');

const context = {
  COMMANDS: ['--help'].concat(commandNames).join(' '),
  OPTS_CASE: optsCases.join('\n')
};

renderTemplate(templateFile, context).then(s => {
  console.log(s);
});
