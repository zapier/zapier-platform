// this is an init hook because the info about which command is clobbered by the time we get to the pre_run hook

// deprecated => recommended
const deprecatedCommands = {
  apps: 'integrations',
};

// can't be fat arrow because it inherits `this` from commands
module.exports = function (options) {
  if (deprecatedCommands[options.id]) {
    this.warn(
      `The \`${options.id}\` command is deprecated. Use the \`${
        deprecatedCommands[options.id]
      }\` command instead.`,
    );
    console.log();
  }
};
