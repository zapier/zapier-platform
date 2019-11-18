const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

const { listApps } = require('../../utils/api');

class Integrations extends BaseCommand {
  async perform() {
    if (this.argv.includes('apps')) {
      this.warn('The `apps` command is deprecated. Use `integrations` instead');
    }
    this.startSpinner('Loading Apps');
    const { apps } = await listApps();
    this.stopSpinner();

    this.log('\nHere are all the apps you have write access to:\n');

    this.logTable({
      rows: apps,
      headers: [
        ['Title', 'title'],
        ['Unique Slug', 'key'],
        ['Date Created', 'date'],
        ['Linked', 'linked']
      ],
      emptyMessage: 'No apps found, try the `zapier register` command.'
    });
  }
}

Integrations.flags = buildFlags({ opts: { format: true } });
Integrations.aliases = ['apps'];
Integrations.description = `Lists any apps that you have admin access to.

This command also checks the current directory for a linked app.`;

module.exports = Integrations;
