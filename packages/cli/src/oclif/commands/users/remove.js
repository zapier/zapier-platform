const ZapierBaseCommand = require('../../ZapierBaseCommand');
const { Args, Flags } = require('@oclif/core');
const { cyan } = require('colors/safe');
const { buildFlags } = require('../../buildFlags');
const { callAPI } = require('../../../utils/api');

class UsersRemoveCommand extends ZapierBaseCommand {
  async perform() {
    if (
      !this.flags.force &&
      !(await this.confirm(
        `About to revoke access to ${cyan(
          this.args.email,
        )}. They won't be able to see your app in the editor and their Zaps will stop working. Are you sure?`,
        true,
      ))
    ) {
      this.log('\ncancelled');
      return;
    }

    const { id } = await this.getWritableApp();
    this.startSpinner('Removing User');
    const url = `/apps/${id}/invitees/${this.args.email}`;
    await callAPI(url, { method: 'DELETE' });
    this.stopSpinner();
  }
}

UsersRemoveCommand.args = {
  email: Args.string({
    description: 'The user to be removed.',
    required: true,
  }),
};
UsersRemoveCommand.flags = buildFlags({
  commandFlags: {
    force: Flags.boolean({
      char: 'f',
      description: 'Skips confirmation. Useful for running programatically.',
    }),
  },
});
UsersRemoveCommand.description = `Remove a user from all versions of your integration.

When this command is run, their Zaps will immediately turn off. They won't be able to use your app again until they're re-invited or it has gone public. In practice, this command isn't run often as it's very disruptive to users.`;
UsersRemoveCommand.aliases = ['users:delete'];
UsersRemoveCommand.skipValidInstallCheck = true;

module.exports = UsersRemoveCommand;
