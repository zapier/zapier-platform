const ZapierBaseCommand = require('../../ZapierBaseCommand');
const { cyan } = require('colors/safe');
const { buildFlags } = require('../../buildFlags');

class UsersAddCommand extends ZapierBaseCommand {
  async perform() {
    await this.confirm(
      `About to invite ${cyan(this.args.email)} to ${
        this.args.version ? `version ${this.args.version}` : 'all versions'
      } of your integration. An invite email will be sent. Is that ok?`,
      true
    );
    // callapi
  }
}

UsersAddCommand.args = [
  {
    name: 'email',
    description:
      "The user to be invited. If they don't have a Zapier account, they'll be prompted to create one.",
    required: true
  },
  {
    name: 'version',
    description:
      'A version string (like 1.2.3). Optional, used only if you want to invite a user to a specific version instead of all versions.'
  }
];
UsersAddCommand.flags = buildFlags();
UsersAddCommand.description = `Add a user to some or all versions of your integration.

When this command is run, we'll send an email to the user inviting them to try your app. You can track the status of that invite using the \`${cyan(
  'zapier users:get'
)}\` command.

Invited users will be able to see your integration's name, logo, and description. They'll also be able to create Zaps using any available triggers and actions.`;
UsersAddCommand.aliases = ['users:invite'];

module.exports = UsersAddCommand;
