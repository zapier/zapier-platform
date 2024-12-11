const ZapierBaseCommand = require('../../ZapierBaseCommand');
const { bold, cyan } = require('colors/safe');
const { listEndpoint } = require('../../../utils/api');
const { buildFlags } = require('../../buildFlags');

class UsersLinksCommand extends ZapierBaseCommand {
  async perform() {
    this.startSpinner('Loading links');
    const { invite_url: inviteUrl, versions_invite_urls: versionInviteUrls } =
      await listEndpoint('invitees');

    this.stopSpinner();

    this.log(
      `\nYou can invite users to ${bold(
        'all',
      )} versions of your integration using the following link:`,
    );
    this.log(`\n${cyan(inviteUrl)}\n`);

    this.log(
      'You can invite users to a specific integration version using the following links:',
    );
    this.logTable({
      rows: Object.entries(versionInviteUrls).map(([version, url]) => ({
        version,
        url,
      })),
      headers: [
        ['Version', 'version'],
        ['URL', 'url'],
      ],
    });

    this.log(
      '\nTo invite a specific user by email, use the `zapier users:add` command.',
    );
  }
}

UsersLinksCommand.flags = buildFlags({ opts: { format: true } });
UsersLinksCommand.description = `Get a list of links that are used to invite users to your integration.`;
UsersLinksCommand.skipValidInstallCheck = true;

module.exports = UsersLinksCommand;
