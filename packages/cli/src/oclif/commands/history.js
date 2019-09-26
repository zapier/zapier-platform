const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

const { listHistory } = require('../../utils/api');

class HistoryCommand extends BaseCommand {
  async perform() {
    const { history } = await listHistory();

    this.logTable({
      rows: history,
      headers: [
        ['What', 'action'],
        ['Message', 'message'],
        ['Who', 'customuser'],
        ['Timestamp', 'date']
      ],
      emptyMessage: 'No historical actions found'
    });
  }
}

HistoryCommand.flags = buildFlags({ opts: { format: true } });
HistoryCommand.examples = ['zapier history'];
HistoryCommand.description = `Get the history of your app.\n\nHistory includes all the changes made over the lifetime of your app. This includes everything from creation, updates, migrations, admins and invitee changes as well as who made the change and when.`;

module.exports = HistoryCommand;
