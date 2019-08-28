const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

const { listVersions } = require('../../utils/api');

class VersionCommand extends BaseCommand {
  async perform() {
    const { versions } = await listVersions();
    this.logTable({
      rows: versions,
      headers: [
        ['Version', 'version'],
        ['Platform', 'platform_version'],
        ['Users', 'user_count'],
        ['Deployment', 'deployment'],
        ['Deprecation Date', 'deprecation_date'],
        ['Timestamp', 'date']
      ],
      emptyMessage:
        'No versions to show. Try adding one with the `zapier push` command'
    });
  }
}

VersionCommand.flags = buildFlags({ opts: { format: true } });
VersionCommand.examples = ['zapier versions'];
VersionCommand.description = `Lists the versions of your app available for use in the Zapier editor.`;

module.exports = VersionCommand;
