// current => new
const deprecatedCommands = {
  apps: 'integrations'
};

module.exports = async function(options) {
  if (deprecatedCommands[options.id]) {
    console.log(
      `\nWARNING: The \`${options.id}\` command is deprecated. Use the \`${
        deprecatedCommands[options.id]
      }\` command instead\n`
    );
  }
};
