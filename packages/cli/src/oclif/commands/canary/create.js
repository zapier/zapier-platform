const ZapierBaseCommand = require('../../ZapierBaseCommand');
const { createCanary, listCanaries } = require('../../../utils/api');
const { buildFlags } = require('../../buildFlags');
const { flags } = require('@oclif/command');

class CanaryCreateCommand extends ZapierBaseCommand {
  async perform() {
    const { flags } = this.parse(CanaryCreateCommand);
    const { versionFrom, versionTo, percent, duration } = flags;

    this.validateVersions(versionFrom, versionTo);
    this.validatePercent(percent);
    this.validateDuration(duration);

    const existingCanary = await this.findExistingCanary(versionFrom, versionTo);
    if (existingCanary) {
      const secondsRemaining = existingCanary.until_timestamp - Math.floor(Date.now() / 1000);
      this.log(`A canary deployment already exists from version ${versionFrom} to version ${versionTo}, there are ${secondsRemaining} seconds remaining`);
      return;
    }

    this.startSpinner(`Creating canary deployment
    - From version: ${versionFrom}
    - To version: ${versionTo}
    - Percent: ${percent}%
    - Duration: ${duration} seconds`
    );

    await createCanary(versionFrom, versionTo, percent, duration);

    this.stopSpinner();
    this.log('Canary deployment created successfully.');
  }

  async findExistingCanary(versionFrom, versionTo) {
    const activeCanaries = await listCanaries();
    return activeCanaries.objects.find(c => c.from_version === versionFrom && c.to_version === versionTo) || null;
  }

  validateVersions(versionFrom, versionTo) {
    this.throwForInvalidVersion(versionFrom);
    this.throwForInvalidVersion(versionTo);
  }

  validatePercent(percent) {
    if (!percent || percent < 0 || percent > 100) {
      this.error('Percent must be between 0 and 100');
    }
  }

  validateDuration(duration) {
    if (!duration || duration <= 30 || duration > 24 * 60 * 60) {
      this.error('Duration must be a positive number between 30 and 86400');
    }
  }
}

CanaryCreateCommand.flags = buildFlags({
  commandFlags: {
    versionFrom: flags.string({char: 'f', description: 'Version to route traffic from', required: true}),
    versionTo: flags.string({char: 't', description: 'Version to canary traffic to', required: true}),
    percent: flags.integer({char: 'p', description: 'Percent of traffic to route to new version', required: true}),
    duration: flags.integer({char: 's', description: 'Duration of the canary in seconds', required: true}),
  },
  opts: {
    format: true
  }
});
CanaryCreateCommand.description = 'Create a new canary deployment';
CanaryCreateCommand.skipValidInstallCheck = true;

module.exports = CanaryCreateCommand;
