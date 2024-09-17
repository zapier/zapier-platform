const ZapierBaseCommand = require('../../ZapierBaseCommand');
const { createCanary, listCanaries } = require('../../../utils/api');

class CanaryCreateCommand extends ZapierBaseCommand {
  async perform() {
    const { versionFrom, versionTo, percent, duration } = this.args;

    this.validateVersions(versionFrom, versionTo);
    this.validatePercent(percent);
    this.validateDuration(duration);

    const existingCanary = await this.findExistingCanary(versionFrom, versionTo);
    if (existingCanary) {
      const secondsRemaining = existingCanary.until_timestamp - Math.floor(Date.now() / 1000);
      this.log(`A canary deployment already exists from version ${versionFrom} to version ${versionTo}, there are ${secondsRemaining} seconds remaining.
      
If you would like to stop this canary now, run \`zapier canary:delete ${versionFrom} ${versionTo}\``);

      return;
    }

    this.startSpinner(`Creating canary deployment
    - From version: ${versionFrom}
    - To version: ${versionTo}
    - Traffic amount: ${percent}%
    - Duration: ${duration} seconds`
    );

    await createCanary(versionFrom, versionTo, percent, duration);

    this.stopSpinner();
    this.log('Canary deployment created successfully.');
  }

  async findExistingCanary(versionFrom, versionTo) {
    const activeCanaries = await listCanaries();
    return activeCanaries.objects.find(c => c.from_version === versionFrom && c.to_version === versionTo);
  }

  validateVersions(versionFrom, versionTo) {
    this.throwForInvalidVersion(versionFrom);
    this.throwForInvalidVersion(versionTo);

    if (versionFrom === versionTo) {
      this.error('Versions can not be the same')
    }
  }

  validatePercent(percent) {
    if (percent < 1 || percent > 100) {
      this.error('Percent must be between 1 and 100');
    }
  }

  validateDuration(duration) {
    if (duration < 30 || duration > 24 * 60 * 60) {
      this.error('Duration must be a positive number between 30 and 86400');
    }
  }
}

CanaryCreateCommand.args = [
  {
    name: 'versionFrom',
    required: true,
    description: 'Version to route traffic from',
  },
  {
    name: 'versionTo',
    required: true,
    description: 'Version to canary traffic to',
  },
  {
    name: 'percent',
    required: true,
    description: 'Percentage (between 1 and 100) of traffic to route to new version',
    parse: (input) => parseInt(input, 10),
  },
  {
    name: 'duration',
    required: true,
    description: 'Duration (between 30 and 86400) of the canary in seconds',
    parse: (input) => parseInt(input, 10),
  },
];

CanaryCreateCommand.description =
  'Create a new canary deployment, diverting a specified percentage of traffic from one version to another for a specified duration. \n' +
  '\n' +
  'Only one canary can be active at the same time. You can run `zapier canary:list` to check. If you would like to create a new canary with different parameters, you can wait for the canary to finish, or delete it using `zapier canary:delete a.b.c x.y.z`. \n' +
  '\n' +
  'Note: this is similar to `zapier migrate` but different in that this is temporary and will "revert" the changes once the specified duration is expired. \n' +
  '\n' +
  '**Only use this command to canary traffic between non-breaking versions!**';

CanaryCreateCommand.examples = [
  'zapier canary:create 1.0.0 1.1.0 25 720',
  'zapier canary:create 2.0.0 2.1.0 50 300'
];
CanaryCreateCommand.skipValidInstallCheck = true;

module.exports = CanaryCreateCommand;
