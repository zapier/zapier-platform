const ZapierBaseCommand = require('../../ZapierBaseCommand');
const { grey, bold } = require('colors/safe');
const { listCanaries } = require('../../../utils/api');
const { buildFlags } = require('../../buildFlags');

class CanaryListCommand extends ZapierBaseCommand {
  async perform() {
    const canaries = await listCanaries();

    const formattedCanaries = canaries.objects.map((c) => ({
      from_version: c.from_version,
      to_version: c.to_version,
      percent: c.percent,
      seconds_remaining: c.until_timestamp - Math.floor(Date.now() / 1000),
      user: c.user,
      account_id: c.account_id,
    }));

    this.log(bold('Active Canaries') + '\n');
    this.logTable({
      rows: formattedCanaries,
      headers: [
        ['From Version', 'from_version'],
        ['To Version', 'to_version'],
        ['Traffic Amount', 'percent'],
        ['Seconds Remaining', 'seconds_remaining'],
        ['User', 'user'],
        ['Account ID', 'account_id'],
      ],
      emptyMessage: grey(`No active canary deployments found.`),
    });
  }
}

CanaryListCommand.flags = buildFlags({ opts: { format: true } });
CanaryListCommand.description = 'List all active canary deployments';
CanaryListCommand.examples = ['zapier canary:list'];
CanaryListCommand.skipValidInstallCheck = true;

module.exports = CanaryListCommand;
