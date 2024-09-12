const ZapierBaseCommand = require('../ZapierBaseCommand');

const { buildFlags } = require('../buildFlags');
const { flags } = require('@oclif/command');
const { grey, bold } = require('colors/safe');
const { createCanary, listCanaries, deleteCanary } = require('../../utils/api');

class CanaryCommand extends ZapierBaseCommand {
  async perform() {
    const { versionFrom, versionTo, percentage, duration } = this.flags;

    if (this.flags.create) {
      if (!versionFrom || !versionTo || !percentage || !duration) {
        this.error('All parameters are required for creating a canary deployment: versionFrom, versionTo, percentage, duration');
      }

      this.startSpinner(`Creating canary deployment
    - From version: ${versionFrom}
    - To version: ${versionTo}
    - Percentage: ${percentage}%
    - Duration: ${duration} seconds`
      )

      await createCanary(versionFrom, versionTo, percentage, duration);

      this.stopSpinner();
    } else if (this.flags.list) {
      const canaries = await listCanaries();

      const formattedCanaries = canaries.objects.map(c => ({
        from_version: c.from_version,
        to_version: c.to_version,
        percent: c.percent,
        seconds_remaining: c.until_timestamp - Math.floor(Date.now() / 1000)
      }));

      this.log(bold('Active Canaries') + '\n');
      this.logTable({
        rows: formattedCanaries,
        headers: [
          ['From Version', 'from_version'],
          ['To Version', 'to_version'],
          ['Traffic Percent', 'percent'],
          ['Seconds Remaining', 'seconds_remaining'],
        ],
        emptyMessage: grey(
          `No active canary deployments found.`
        ),
      })

    } else if (this.flags.delete) {
      if (!versionFrom || !versionTo) {
        this.error('The versionFrom and versionTo parameters are required for deleting a canary deployment');
      }

      this.startSpinner(`Deleting active canary from ${versionFrom} to ${versionTo}`);
      await deleteCanary(this.flags.versionFrom, this.flags.versionTo);
      this.stopSpinner();
    }
  }
}

CanaryCommand.flags = buildFlags({
  commandFlags: {
    'create': flags.boolean({char: 'c', description: 'Create a new canary deployment'}),
    'list': flags.boolean({char: 'l', description: 'List all canary deployments'}),
    'delete': flags.boolean({char: 'd', description: 'Delete a canary deployment'}),
    'versionFrom': flags.string({char: 'f', description: 'Version to divert traffic from'}),
    'versionTo': flags.string({char: 't', description: 'Version to canary traffic to'}),
    'percentage': flags.integer({char: 'p', description: 'Percentage of traffic to route to new version'}),
    'duration': flags.integer({char: 's', description: 'Duration of the canary in seconds'}),
  },
  opts: {
    format: true
  }
});

CanaryCommand.description = 'Canary traffic from one app version to another app version.';
CanaryCommand.skipValidInstallCheck = true;
CanaryCommand.examples = [
  'zapier canary --create --versionFrom 1.5.1 --versionTo 1.6.0 --percentage 10 --duration 120',
  'zapier canary --list',
  'zapier canary --delete --versionFrom 1.5.1'
];

module.exports = CanaryCommand;