const chalk = require('chalk');
const { marked } = require('marked');
const { markedTerminal } = require('marked-terminal');

marked.use(
  markedTerminal({
    tab: 2,
    width: process.stdout.getWindowSize()[0] - 2,
    reflowText: true,
    codespan: chalk.underline.bold,
  }),
);

module.exports = (options) => {
  const cmdId = options.id === 'help' ? options.argv[0] : options.id;
  const cmd = options.config.findCommand(cmdId);
  if (cmd) {
    if (cmd.description) {
      cmd.description = marked.parse(cmd.description).trim();
    }
    // TODO: Do the same for flag descriptions?
  }
};
