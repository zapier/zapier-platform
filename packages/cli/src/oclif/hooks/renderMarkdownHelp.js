const chalk = require('chalk');
const { marked } = require('marked');
const TerminalRenderer = require('marked-terminal');
const { stdtermwidth } = require('@oclif/plugin-help/lib/screen');

marked.setOptions({
  renderer: new TerminalRenderer({
    tab: 2,
    width: stdtermwidth - 2,
    reflowText: true,
    codespan: chalk.underline.bold,
  }),
});

module.exports = (options) => {
  const cmdId = options.id === 'help' ? options.argv[0] : options.id;
  const cmd = options.config.findCommand(cmdId);
  if (cmd) {
    if (cmd.description) {
      cmd.description = marked(cmd.description).trim();
    }
    // TODO: Do the same for flag descriptions?
  }
};
