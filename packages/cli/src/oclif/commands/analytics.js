const BaseCommand = require('../ZapierBaseCommand');
const { Flags } = require('@oclif/core');
const { buildFlags } = require('../buildFlags');
const {
  currentAnalyticsMode,
  modes,
  setAnalyticsMode,
} = require('../../utils/analytics');
const colors = require('colors/safe');

class AnalyticsCommand extends BaseCommand {
  async perform() {
    const currentMode = await currentAnalyticsMode();
    this.log(
      `The current analytics mode is ${colors.cyan(
        currentMode,
      )}. Analytics may be skipped anyway if you've got DISABLE_ZAPIER_ANALYTICS set to a truthy value.`,
    );

    if (this.flags.mode) {
      this.log(`\nSetting analytics mode to ${colors.cyan(this.flags.mode)}.`);
      return setAnalyticsMode(this.flags.mode);
    } else {
      this.log(
        `You can see what data is sent by running \`${colors.yellow(
          'DEBUG=zapier:analytics zapier someCommand',
        )}\`.\n\nYou can change your analytics preferences by re-running this command with the \`--mode\` flag.\n\nThe data collected is as generic as we can make it while still getting useful input. No specific information about your filesystem is collected. Your Zapier user id is collected so that we can better debug issues. We will never use this data for any advertising puposes.`,
      );
    }
  }
}

AnalyticsCommand.flags = buildFlags({
  commandFlags: {
    mode: Flags.string({
      char: 'm',
      options: Object.keys(modes),
      description:
        'Choose how much information to share. Anonymous mode drops the OS type and Zapier user id, but keeps command info. Identifying information is used only for debugging purposes.',
    }),
  },
});
AnalyticsCommand.examples = ['zapier analytics --mode enabled'];
AnalyticsCommand.description = `Show the status of the analytics that are collected. Also used to change what is collected.`;
AnalyticsCommand.skipValidInstallCheck = true;

module.exports = AnalyticsCommand;
