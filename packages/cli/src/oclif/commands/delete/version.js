const BaseCommand = require('../../ZapierBaseCommand');
const { buildFlags } = require('../../buildFlags');
const { cyan } = require('colors/safe');
const { getLinkedApp, callAPI } = require('../../../utils/api');

class DeleteVersionCommand extends BaseCommand {
  async perform() {
    const { version } = this.args;
    // validate version
    this.startSpinner('Loading App');
    const { id, title } = await getLinkedApp();
    this.stopSpinner();
    this.startSpinner(`Deleting version ${version} of app "${title}"`);
    await callAPI(`/apps/${id}/versions/${version}`, {
      method: 'DELETE'
    });
    this.stopSpinner();
  }
}

DeleteVersionCommand.args = [
  {
    name: 'version',
    required: true,
    description: `Specify the version to delete. It must have no users or Zaps.`
  }
];
DeleteVersionCommand.flags = buildFlags();
DeleteVersionCommand.description = `Deletes a specific version of your integration.

This only works if there are no users or Zaps on that version. You will probably need to have run ${cyan(
  'zapier migrate'
)} and ${cyan('zapier deprecate')} before this comand will work.`;

module.exports = DeleteVersionCommand;
