const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

const { listApps } = require('../../utils/api');

class AppsCommand extends BaseCommand {
  async perform() {
    const { apps } = await listApps();

    this.log('Here are all the apps you have write access to:\n');

    this.logTable({
      rows: apps,
      headers: [
        ['Title', 'title'],
        ['Unique Slug', 'key'],
        ['Date Created', 'date'],
        ['Linked?', 'linked']
      ],
      emptyMessage: 'No apps found, try the `zapier register` command.'
    });
  }
}

AppsCommand.flags = buildFlags({ opts: { format: true } });
AppsCommand.examples = ['zapier apps'];
AppsCommand.description = `Lists any apps that you have admin access to.\n\nThis command also checks the current directory for a linked app.`;

module.exports = AppsCommand;
