const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

const { listHistory } = require('../../utils/api');

class HistoryCommand extends BaseCommand {
  async perform() {
    this.startSpinner('Loading history');
    const { history } = await listHistory();
    this.stopSpinner();

    this.logTable({
      rows: history,
      headers: [
        ['What', 'action'],
        ['Message', 'message'],
        ['Who', 'customuser'],
        ['Version', 'version'],
        ['Timestamp', 'date'],
      ],
      emptyMessage: 'No historical actions found',
    });
  }
}

HistoryCommand.skipValidInstallCheck = true;
HistoryCommand.flags = buildFlags({ opts: { format: true } });
HistoryCommand.description = `Get the history of your integration.

History includes all the changes made over the lifetime of your integration. This includes everything from creation, updates, migrations, admins, and invitee changes, as well as who made the change and when.`;

module.exports = HistoryCommand;
