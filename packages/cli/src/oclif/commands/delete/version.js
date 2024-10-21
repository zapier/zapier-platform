const BaseCommand = require('../../ZapierBaseCommand');
const { Args } = require('@oclif/core');
const { buildFlags } = require('../../buildFlags');
const { callAPI } = require('../../../utils/api');

class DeleteVersionCommand extends BaseCommand {
  async perform() {
    const { version } = this.args;
    this.throwForInvalidVersion(version);

    const { id, title } = await this.getWritableApp();

    this.startSpinner(`Deleting version ${version} of app "${title}"`);
    await callAPI(`/apps/${id}/versions/${version}`, {
      method: 'DELETE',
    });
    this.stopSpinner();
  }
}

DeleteVersionCommand.args = {
  version: Args.string({
    description: `Specify the version to delete. It must have no users or Zaps.`,
    required: true,
  }),
};
DeleteVersionCommand.flags = buildFlags();
DeleteVersionCommand.skipValidInstallCheck = true;
DeleteVersionCommand.description = `Delete a specific version of your integration.

This only works if there are no users or Zaps on that version. You will probably need to have run \`zapier migrate\` and \`zapier deprecate\` before this command will work.`;

module.exports = DeleteVersionCommand;
