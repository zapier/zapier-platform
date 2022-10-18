const ZapierBaseCommand = require('../ZapierBaseCommand');
const { CURRENT_APP_FILE } = require('../../constants');
const { buildFlags } = require('../buildFlags');
const { callAPI, writeLinkedAppConfig } = require('../../utils/api');

class RegisterCommand extends ZapierBaseCommand {
  async perform() {
    let title = this.args.title;
    if (!title) {
      title = await this.prompt('What is the title of your integration?');
    }

    this.startSpinner(`Registering your new integration "${title}"`);
    const app = await callAPI('/apps', { method: 'POST', body: { title } });
    this.stopSpinner();
    this.startSpinner(
      `Linking app to current directory with \`${CURRENT_APP_FILE}\``
    );
    await writeLinkedAppConfig(app, process.cwd());
    this.stopSpinner();
    this.log(
      '\nFinished! Now that your integration is registered with Zapier, you can `zapier push`!'
    );
  }
}

RegisterCommand.skipValidInstallCheck = true;
RegisterCommand.args = [
  {
    name: 'title',
    description:
      "Your integrations's public title. Asked interactively if not present.",
  },
];
RegisterCommand.flags = buildFlags();
RegisterCommand.examples = [
  'zapier register',
  'zapier register "My Cool Integration"',
];
RegisterCommand.description = `Register a new integration in your account.

After running this, you can run \`zapier push\` to build and upload your integration for use in the Zapier editor.

This will change the  \`./${CURRENT_APP_FILE}\` (which identifies this directory as holding code for a specific integration).`;

module.exports = RegisterCommand;
