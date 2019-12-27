const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

const { callAPI } = require('../../utils/api');
const { convertVisualApp, convertLegacyApp } = require('../../utils/convert');
const { isExistingEmptyDir } = require('../../utils/files');
const { initApp } = require('../../utils/init');
const { BASE_ENDPOINT } = require('../../constants');

const { flags } = require('@oclif/command');

class ConvertCommand extends BaseCommand {
  generateCreateFunc(isVisual, appId, version) {
    return async tempAppDir => {
      if (isVisual) {
        // has info about the app, such as title
        // has a CLI version of the actual app implementation
        this.throwForInvalidVersion(version);
        this.startSpinner('Downloading integration from Zapier');
        try {
          const [appInfo, versionInfo] = await Promise.all([
            callAPI(`/apps/${appId}`, undefined, true),
            callAPI(`/apps/${appId}/versions/${version}`, undefined, true)
          ]);

          if (!versionInfo.definition_override) {
            this.error(
              `Integration ${appId} @ ${version} is already a CLI integration and can't be converted. Instead, pick a version that was created using the Visual Builder.`
            );
          }
          this.stopSpinner();

          return convertVisualApp(
            appInfo,
            versionInfo.definition_override,
            tempAppDir
          );
        } catch (e) {
          if (e.status === 404) {
            this.error(
              `Visual Builder integration ${appId} @ ${version} not found. If you want to convert a Legacy Web Builder app, don't pass a \`--version\` option. Otherwise, double check the integration id and version.`
            );
          }
          this.error(e);
        }
      } else {
        // has info about the app, such as title
        const legacyDumpUrl = `${BASE_ENDPOINT}/api/developer/v1/apps/${appId}/dump`;
        // has a CLI version of the actual app implementation
        const cliDumpUrl = `${BASE_ENDPOINT}/api/developer/v1/apps/${appId}/cli-dump`;

        this.startSpinner('Downloading app from Zapier');

        try {
          const [legacyApp, appDefinition] = await Promise.all([
            // these have weird call signatures because we're not calling the platform api
            callAPI(null, { url: legacyDumpUrl }, true),
            callAPI(null, { url: cliDumpUrl }, true)
          ]);
          // The JSON dump of the app doesn't have app ID, let's add it here
          legacyApp.general.app_id = appId;

          this.stopSpinner();

          return convertLegacyApp(legacyApp, appDefinition, tempAppDir);
        } catch (e) {
          if (e.status === 404) {
            this.error(
              `Legacy Web Builder app ${appId} not found. If you want to convert a Visual Builder app, make sure to pass a \`--version\` option.`
            );
          }
          this.error(e);
        }
      }
    };
  }

  async perform() {
    const { integrationId: appId, path } = this.args;
    const { version } = this.flags;
    if (!appId) {
      this.error(
        'You must provide an integrationId. See zapier convert --help for more info.'
      );
    }
    const isVisual = Boolean(this.flags.version);

    if (
      (await isExistingEmptyDir(path)) &&
      !(await this.confirm(`Path "${path}" is not empty. Continue anyway?`))
    ) {
      this.exit();
    }

    await initApp(path, this.generateCreateFunc(isVisual, appId, version));
  }
}

ConvertCommand.args = [
  {
    name: 'integrationId',
    required: true,
    description: `To get the integration id, go to "${BASE_ENDPOINT}/app/developer", click on an integration, and copy the number directly  after "/app/" in the url.`,
    parse: input => Number(input)
  },
  {
    name: 'path',
    required: true,
    description: 'Relative to your current path - IE: `.` for current directory'
  }
];
ConvertCommand.flags = buildFlags({
  commandFlags: {
    version: flags.string({
      char: 'v',
      description:
        'Convert a specific version. Required when converting a Visual Builder app'
    })
  }
});
ConvertCommand.description = `Convert a Legacy Web Builder or Visual Builder integration to a CLI integration.

If you're converting a **Legacy Web Builder** app: the new app contains code stubs only. It is supposed to get you started - it isn't going to create a complete app!
After running this, you'll have a new app in your directory, with stubs for your trigger and actions.  If you re-run this command on an existing directory it will leave existing files alone and not clobber them.

If you're converting a **Visual Builder** app, then it will be identical and ready to push and use immediately!

You'll need to do a \`zapier push\` before the new version is visible in the editor, but otherwise you're good to go.`;

module.exports = ConvertCommand;
