const ZapierBaseCommand = require('../../ZapierBaseCommand');
const { flags } = require('@oclif/command');
const { deleteCanary, listCanaries } = require('../../../utils/api');

class CanaryDeleteCommand extends ZapierBaseCommand {
  async perform() {
    const { flags } = this.parse(CanaryDeleteCommand);
    const { versionFrom, versionTo } = flags;

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
    this.throwForInvalidVersion(versionFrom);
    this.throwForInvalidVersion(versionTo);
  }
}

CanaryDeleteCommand.flags = {
  versionFrom: flags.string({char: 'f', description: 'Version to route traffic from', required: true}),
  versionTo: flags.string({char: 't', description: 'Version canary traffic is routed to', required: true}),
};
CanaryDeleteCommand.description = 'Delete an active canary deployment';
CanaryDeleteCommand.skipValidInstallCheck = true;

module.exports = CanaryDeleteCommand;