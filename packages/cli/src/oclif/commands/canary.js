const ZapierBaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const { flags } = require('@oclif/command');
const { grey, bold } = require('colors/safe');
const { createCanary, listCanaries, deleteCanary } = require('../../utils/api');

class CanaryCommand extends ZapierBaseCommand {
  async perform() {
    const { versionFrom, versionTo, percentage, duration } = this.flags;

    if (this.flags.create) {
      await this.createCanary(versionFrom, versionTo, percentage, duration);
    } else if (this.flags.list) {
      await this.listCanaries();
    } else if (this.flags.delete) {
      await this.deleteCanary(versionFrom, versionTo);
    }
  }

  async createCanary(versionFrom, versionTo, percentage, duration) {
    this.validateVersions(versionFrom, versionTo);
    this.validatePercentage(percentage);
    this.validateDuration(duration);

    const existingCanary = await this.findExistingCanary(versionFrom, versionTo);
    if (existingCanary) {
      const secondsRemaining = existingCanary.until_timestamp - Math.floor(Date.now() / 1000)
      this.log(`A canary deployment already exists from version ${versionFrom} to version ${versionTo}, there are ${secondsRemaining} seconds remaining`);
      return;
    }

    this.startSpinner(`Creating canary deployment
    - From version: ${versionFrom}
    - To version: ${versionTo}
    - Percentage: ${percentage}%
    - Duration: ${duration} seconds`
    );

    await createCanary(versionFrom, versionTo, percentage, duration);

    this.stopSpinner();
    this.log('Canary deployment created successfully.');
  }

  async listCanaries() {
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
    });
  }

  async deleteCanary(versionFrom, versionTo) {
    this.validateVersions(versionFrom, versionTo);

    const existingCanary = await this.findExistingCanary(versionFrom, versionTo);
    if (!existingCanary) {
      this.log(`There is no active canary from version ${versionFrom} to version ${versionTo}`);
      return;
    }

    const confirmed = await this.confirm(`Are you sure you want to delete the canary from ${versionFrom} to ${versionTo}?`);
    if (!confirmed) {
      this.log('Canary deletion cancelled.');
      return;
    }

    this.startSpinner(`Deleting active canary from ${versionFrom} to ${versionTo}`);
    await deleteCanary(versionFrom, versionTo);
    this.stopSpinner();
    this.log('Canary deployment deleted successfully.');
  }

  async findExistingCanary(versionFrom, versionTo) {
    const activeCanaries = await listCanaries();
    return activeCanaries.objects.find(c => c.from_version === versionFrom && c.to_version === versionTo) || null;
  }

  validateVersions(versionFrom, versionTo) {
    if (!versionFrom || !versionTo) {
      this.error('Both versionFrom and versionTo are required');
    }
  }

  validatePercentage(percentage) {
    if (!percentage || percentage < 0 || percentage > 100) {
      this.error('Percentage must be between 0 and 100');
    }
  }

  validateDuration(duration) {
    if (!duration || duration <= 30 || duration > 24 * 60 * 60) {
      this.error('Duration must be a positive number between 30 and 86400');
    }
  }
}

CanaryCommand.flags = buildFlags({
  commandFlags: {
    'create': flags.boolean({char: 'c', description: 'Create a new canary deployment'}),
    'list': flags.boolean({char: 'l', description: 'List all canary deployments'}),
    'delete': flags.boolean({char: 'd', description: 'Delete a canary deployment'}),
    'versionFrom': flags.string({char: 'f', description: 'Version to route traffic from'}),
    'versionTo': flags.string({char: 't', description: 'Version to canary traffic to'}),
    'percentage': flags.integer({char: 'p', description: 'Percentage of traffic to route to new version'}),
    'duration': flags.integer({char: 's', description: 'Duration of the canary in seconds'}),
  },
  opts: {
    format: true
  }
});

CanaryCommand.description = 'Manage canary deployments between app versions.';
CanaryCommand.skipValidInstallCheck = true;
CanaryCommand.examples = [
  'zapier canary --create --versionFrom 1.5.1 --versionTo 1.6.0 --percentage 10 --duration 120',
  'zapier canary --list',
  'zapier canary --delete --versionFrom 1.5.1 --versionTo 1.6.0'
];

module.exports = CanaryCommand;