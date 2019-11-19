const ZapierBaseCommand = require('../../ZapierBaseCommand');
const { cyan } = require('colors/safe');
const { buildFlags } = require('../../buildFlags');

class UsersRemoveCommand extends ZapierBaseCommand {
  async perform() {
    await this.confirm(
      `About to revoke access to ${cyan(
        this.args.email
      )}. They won't be able to see your app in the editor and their Zaps will stop working. Are you sure?`
    );
    // callapi
  }
}

UsersRemoveCommand.args = [
  {
    name: 'email',
    description: 'The user to be removed.',
    required: true
  }
];
UsersRemoveCommand.flags = buildFlags();
UsersRemoveCommand.description = `Remove a user from all versions of your integration.

When this command is run, their Zaps will immediately turn off. They won't be able to use your app again until they're re-invited or it has gone public. In practice, this command isn't run often as it's very disruptive to users.`;
UsersRemoveCommand.aliases = ['users:delete'];

module.exports = UsersRemoveCommand;
