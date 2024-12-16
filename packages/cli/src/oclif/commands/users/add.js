const ZapierBaseCommand = require('../../ZapierBaseCommand');
const { Args, Flags } = require('@oclif/core');
const { cyan } = require('colors/safe');
const { buildFlags } = require('../../buildFlags');
const { callAPI } = require('../../../utils/api');

class UsersAddCommand extends ZapierBaseCommand {
  async perform() {
    if (
      !this.flags.force &&
      !(await this.confirm(
        `About to invite ${cyan(this.args.email)} to ${
          this.args.version ? `version ${this.args.version}` : 'all versions'
        } of your integration. An invite email will be sent. Is that ok?`,
        true,
      ))
    ) {
      this.log('\ncancelled');
      return;
    }

    const { id } = await this.getWritableApp();
    this.startSpinner('Inviting user');
    const url = `/apps/${id}/invitees/${this.args.email}${
      this.args.version ? `/${this.args.version}` : ''
    }`;
    await callAPI(url, { method: 'POST' });
    this.stopSpinner();
  }
}

UsersAddCommand.args = {
  email: Args.string({
    description:
      "The user to be invited. If they don't have a Zapier account, they'll be prompted to create one.",
    required: true,
  }),
  version: Args.string({
    description:
      'A version string (like 1.2.3). Optional, used only if you want to invite a user to a specific version instead of all versions.',
  }),
};
UsersAddCommand.flags = buildFlags({
  commandFlags: {
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation. Useful for running programatically.',
    }),
  },
});
UsersAddCommand.examples = [
  'zapier users:add bruce@wayne.com',
  'zapier users:add alfred@wayne.com 1.2.3',
];
UsersAddCommand.description = `Add a user to some or all versions of your integration.

When this command is run, we'll send an email to the user inviting them to try your integration. You can track the status of that invite using the \`zapier users:get\` command.

Invited users will be able to see your integration's name, logo, and description. They'll also be able to create Zaps using any available triggers and actions.`;
UsersAddCommand.aliases = ['users:invite'];
UsersAddCommand.skipValidInstallCheck = true;

module.exports = UsersAddCommand;
