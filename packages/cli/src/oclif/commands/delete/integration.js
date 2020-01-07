const BaseCommand = require('../../ZapierBaseCommand');
const { buildFlags } = require('../../buildFlags');
const { getLinkedApp, callAPI } = require('../../../utils/api');

class DeleteAppCommand extends BaseCommand {
  async perform() {
    this.startSpinner('Loading App');
    const { id, title } = await getLinkedApp();
    this.stopSpinner();
    this.startSpinner(`Deleting "${title}"`);
    await callAPI(`/apps/${id}`, {
      method: 'DELETE'
    });
    this.stopSpinner();
  }
}

DeleteAppCommand.flags = buildFlags();
DeleteAppCommand.description = `Delete your integration (including all versions).

This only works if there are no active users or Zaps on any version. If you only want to delete certain versions, use the \`zapier delete:version\` command instead. It's unlikely that you'll be able to run this on an app that you've pushed publicly, since there are usually still users.`;
DeleteAppCommand.aliases = ['delete:app'];

module.exports = DeleteAppCommand;
