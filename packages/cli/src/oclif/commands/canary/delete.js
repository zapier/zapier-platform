const ZapierBaseCommand = require('../../ZapierBaseCommand');
const { deleteCanary, listCanaries } = require('../../../utils/api');

class CanaryDeleteCommand extends ZapierBaseCommand {
  async perform() {
    const { versionFrom, versionTo } = this.args;

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
    return activeCanaries.objects.find(c => c.from_version === versionFrom && c.to_version === versionTo);
  }

  validateVersions(versionFrom, versionTo) {
    this.throwForInvalidVersion(versionFrom);
    this.throwForInvalidVersion(versionTo);

    if (versionFrom === versionTo) {
      this.error('Versions can not be the same')
    }
  }
}

CanaryDeleteCommand.args = [
  {
    name: 'versionFrom',
    required: true,
    description: 'Version to route traffic from',
  },
  {
    name: 'versionTo',
    required: true,
    description: 'Version canary traffic is routed to',
  },
];
CanaryDeleteCommand.description = 'Delete an active canary deployment';
CanaryDeleteCommand.examples = ['zapier canary:delete 1.0.0 1.1.0'];
CanaryDeleteCommand.skipValidInstallCheck = true;

module.exports = CanaryDeleteCommand;