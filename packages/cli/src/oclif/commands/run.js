const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

const { listVersions } = require('../../utils/api');

class RunCommand extends BaseCommand {
  async perform() {
    // let title = this.args.title;
    // if (!title) {
    //   title = await this.prompt('What is the title of your integration?');
    // }

    this.startSpinner('Running action');
    const { versions } = await listVersions();
    this.stopSpinner();

    this.logTable({
      rows: versions,
      headers: [
        ['Version', 'version'],
        ['Platform', 'platform_version'],
        ['Users', 'user_count'],
        ['Deployment', 'deployment'],
        ['Deprecation Date', 'deprecation_date'],
        ['Timestamp', 'date'],
      ],
      emptyMessage:
        'No versions to show. Try adding one with the `zapier push` command',
    });

    if (versions.map((v) => v.user_count).filter((c) => c === null).length) {
      this.warn(
        'Some user counts are still being calculated - run this command again in ~10 seconds (or longer if your integration has lots of users).'
      );
    }
  }
}

RunCommand.flags = buildFlags({ opts: { format: true } });
RunCommand.description = `List the versions of your integration available for use in the Zapier editor.`;

module.exports = RunCommand;
