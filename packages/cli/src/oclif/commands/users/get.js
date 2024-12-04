const ZapierBaseCommand = require('../../ZapierBaseCommand');
const { cyan, yellow } = require('colors/safe');
const { listEndpoint } = require('../../../utils/api');
const { buildFlags } = require('../../buildFlags');

class UsersListCommand extends ZapierBaseCommand {
  async perform() {
    this.startSpinner('Loading users');
    const { users } = await listEndpoint('invitees', 'users');

    const cleanedUsers = users.map((u) => ({
      ...u,
      app_version: u.app_version || 'All',
    }));

    this.stopSpinner();

    this.log(
      `\n${yellow(
        'Note',
      )} that this list of users is NOT a comprehensive list of everyone who is using your integration. It only includes users who were invited directly by email (using the \`users:add EMAIL\` command or the web UI).\n`,
    );

    this.logTable({
      rows: cleanedUsers,
      headers: [
        ['Email', 'email'],
        ['Status', 'status'],
        ['Version', 'app_version'],
      ],
      emptyMessage: 'No users have been invited directly by email.',
    });

    this.log(
      `\nTo invite users via a link, use the \`${cyan(
        'zapier users:links',
      )}\` command. To invite a specific user by email, use the \`${cyan(
        'zapier users:add',
      )}\` command.`,
    );
  }
}

UsersListCommand.flags = buildFlags({ opts: { format: true } });
UsersListCommand.description = `Get a list of users who have been invited to your integration.

Note that this list of users is NOT a comprehensive list of everyone who is using your integration. It only includes users who were invited directly by email (using the \`${cyan(
  'zapier users:add',
)}\` command or the web UI). Users who joined by clicking links generated using the \`${cyan(
  'zapier user:links',
)}\` command won't show up here.`;
UsersListCommand.aliases = ['users:list'];
UsersListCommand.skipValidInstallCheck = true;

module.exports = UsersListCommand;
