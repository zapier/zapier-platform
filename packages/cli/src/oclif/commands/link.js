const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const { cyan } = require('colors/safe');

const { listApps, writeLinkedAppConfig } = require('../../utils/api');
const { CURRENT_APP_FILE } = require('../../constants');

class LinkCommand extends BaseCommand {
  async perform() {
    this.startSpinner('Loading Integrations');
    const { apps } = await listApps();
    this.stopSpinner();

    const chosenApp = await this.promptWithList(
      'Which integration should be associated with the code in this directory?',
      apps.map(app => ({
        name: app.title,
        value: { id: app.id, key: app.key }
      }))
    );

    this.startSpinner(`Setting up ${CURRENT_APP_FILE}`);
    await writeLinkedAppConfig(chosenApp);
    this.stopSpinner();
    this.log(`Done! Now you can \`${cyan('zapier push')}\``);
  }
}

LinkCommand.flags = buildFlags();
LinkCommand.description = `Link the current directory with an existing integration

This command generates a ${CURRENT_APP_FILE} file in the directory in which it's ran. This file ties this code to an integration and is referenced frequently during \`push\` and \`validate\` operations. This file should be checked into source control.

If you're starting an integration from scratch, use \`${cyan(
  'zapier init'
)}\` instead.`;

module.exports = LinkCommand;
