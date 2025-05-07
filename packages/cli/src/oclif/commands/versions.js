const colors = require('colors/safe');
const { Flags } = require('@oclif/core');
const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

const { listVersions } = require('../../utils/api');

class VersionCommand extends BaseCommand {
  async perform() {
    this.startSpinner('Loading versions');
    const { versions } = await listVersions();
    this.stopSpinner();
    const rows = versions.map((v) => ({
      ...v,
      state: v.lifecycle.status,
    }));

    const visibleVersions = this.flags.all
      ? rows
      : rows.filter((v) => v.state !== 'deprecated');

    this.logTable({
      rows: visibleVersions,
      headers: [
        ['Version', 'version'],
        ['Platform', 'platform_version'],
        ['Zap Users', 'user_count'],
        ['State', 'state'],
        ['Deprecation Date', 'deprecation_date'],
        ['Timestamp', 'date'],
      ],
      emptyMessage:
        'No versions to show. Try adding one with the `zapier push` command',
    });

    this.logTable({
      headers: [],
      rows: [
        {
          version: `- ${colors.bold('Errors')}`,
          platform_version:
            'Issues that will prevent your integration from functioning properly. They block you from pushing.',
        },
        {
          version: `- ${colors.bold('Publishing Tasks')}`,
          platform_version:
            'To-dos that must be addressed before your integration can be included in the App Directory. They block you from promoting and publishing.',
        },
        {
          version: `- ${colors.bold('Warnings')}`,
          platform_version:
            "Issues and recommendations that need human reviews by Zapier before publishing your integration. They don't block.",
        },
      ],
      hasBorder: false,
      style: { head: [], 'padding-left': 0, 'padding-right': 0 },
    });

    if (versions.map((v) => v.user_count).filter((c) => c === null).length) {
      this.warn(
        'Some user counts are still being calculated - run this command again in ~10 seconds (or longer if your integration has lots of users).',
      );
    }
  }
}

VersionCommand.skipValidInstallCheck = true;
VersionCommand.flags = buildFlags({
  commandFlags: {
    all: Flags.boolean({
      char: 'a',
      description: `List all versions, including deprecated versions.`,
    }),
  },
  opts: { format: true },
});
VersionCommand.description = `List the versions of your integration available for use in Zapier automations.`;

module.exports = VersionCommand;
