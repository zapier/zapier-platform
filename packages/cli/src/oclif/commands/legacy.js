const BaseCommand = require('../ZapierBaseCommand');
const { Args, Flags } = require('@oclif/core');
const { buildFlags } = require('../buildFlags');
const colors = require('colors/safe');

const { callAPI } = require('../../utils/api');

class LegacyCommand extends BaseCommand {
  async perform() {
    const app = await this.getWritableApp();
    const { version } = this.args;

    this.log(
      `${colors.yellow('Warning: .')}\n` +
        `${colors.yellow('If all your changes are non-breaking, use `zapier migrate` instead to move users over to a newer version.')}\n`,
    );

    if (
      !this.flags.force &&
      !(await this.confirm(
        'Are you sure you want to make this version legacy? Existing Zaps and automations will continue to work, but users may not be able to create new Zaps or automations with this version.',
      ))
    ) {
      this.log('\nCancelled, version is not marked as legacy.');
      return;
    }

    this.log(
      `\nPreparing to make version ${version} your app "${app.title}" legacy.\n`,
    );
    const url = `/apps/${app.id}/versions/${version}/legacy`;
    this.startSpinner(`Making ${version} legacy`);
    await callAPI(url, {
      method: 'PUT',
    });
    this.stopSpinner();
  }
}

LegacyCommand.flags = buildFlags({
  commandFlags: {
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt. Use with caution.',
    }),
  },
});
LegacyCommand.args = {
  version: Args.string({
    description: 'The version to mark as legacy.',
    required: true,
  }),
};
LegacyCommand.examples = ['zapier legacy 1.2.3'];
LegacyCommand.description = `Mark a non-production version of your integration as legacy.

Use this when an integration version is no longer recommended for new users, but you don't want to block existing users from using it.

Reasons why you might want to mark a version as legacy:
- this version may be discontinued in the future
- this version has bugs
- a newer version has been released and you want to encourage users to upgrade

`;
LegacyCommand.skipValidInstallCheck = true;

module.exports = LegacyCommand;
