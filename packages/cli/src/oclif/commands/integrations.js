const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

const { listApps } = require('../../utils/api');

class IntegrationsCommand extends BaseCommand {
  async perform() {
    this.startSpinner('Loading Integrations');
    const { apps } = await listApps();
    this.stopSpinner();

    this.log('\nHere are all the integrations you have write access to:\n');

    this.logTable({
      rows: apps,
      headers: [
        ['Title', 'title'],
        ['Unique Slug', 'key'],
        ['Date Created', 'date'],
        ['Linked', 'linked']
      ],
      emptyMessage: 'No integrations found, try the `zapier register` command.'
    });
  }
}

IntegrationsCommand.flags = buildFlags({ opts: { format: true } });
IntegrationsCommand.aliases = ['apps'];
IntegrationsCommand.description = `Lists any integrations that you have admin access to.

This command also checks the current directory for a linked integration.`;

module.exports = IntegrationsCommand;
