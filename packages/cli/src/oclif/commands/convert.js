const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

const { callAPI } = require('../../utils/api');
const { convertApp } = require('../../utils/convert');
const { isExistingEmptyDir } = require('../../utils/files');
const { initApp } = require('../../utils/init');
const { BASE_ENDPOINT } = require('../../constants');

const { flags } = require('@oclif/command');

class ConvertCommand extends BaseCommand {
  generateCreateFunc(isVisual, appId, version) {
    return async (tempAppDir) => {
      if (isVisual) {
        // has info about the app, such as title
        // has a CLI version of the actual app implementation
        this.throwForInvalidVersion(version);
        this.startSpinner('Downloading integration from Zapier');
        try {
          const [appInfo, versionInfo] = await Promise.all([
            callAPI(`/apps/${appId}`, undefined, true),
            callAPI(`/apps/${appId}/versions/${version}`, undefined, true),
          ]);

          if (!versionInfo.definition_override) {
            this.error(
              `Integration ${appId} @ ${version} is already a CLI integration and can't be converted. Instead, pick a version that was created using the Visual Builder.`
            );
          }
          this.stopSpinner();

          return convertApp(
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

        this.startSpinner('Downloading integration from Zapier');

        try {
          const [legacyApp, appDefinition] = await Promise.all([
            // these have weird call signatures because we're not calling the platform api
            callAPI(null, { url: legacyDumpUrl }, true),
            callAPI(null, { url: cliDumpUrl }, true),
          ]);
          // The JSON dump of the app doesn't have app ID, let's add it here
          legacyApp.general.app_id = appId;

          this.stopSpinner();

          return convertApp(legacyApp, appDefinition, tempAppDir);
        } catch (e) {
          if (e.status === 404) {
            this.error(
              `Legacy Web Builder app ${appId} not found. If you want to convert a Visual Builder integration, make sure to pass a \`--version\` option.`
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
    description: `To get the integration/app ID, go to "${BASE_ENDPOINT}/app/developer", click on an integration, and copy the number directly after "/app/" in the URL.`,
    parse: (input) => Number(input),
  },
  {
    name: 'path',
    required: true,
    description:
      'Relative to your current path - IE: `.` for current directory.',
  },
];
ConvertCommand.flags = buildFlags({
  commandFlags: {
    version: flags.string({
      char: 'v',
      description:
        'Convert a specific version. Required when converting a Visual Builder integration.',
    }),
  },
});
ConvertCommand.description = `Convert a Legacy Web Builder app or Visual Builder integration to a CLI integration.

If you're converting a **Legacy Web Builder** app: the new integration will have a dependency named zapier-platform-legacy-scripting-runner, a shim used to simulate behaviors that are specific to Legacy Web Builder. There could be differences on how the shim simulates and how Legacy Web Builder actually behaves on some edge cases, especially you have custom scripting code.

If you're converting a **Visual Builder** app, then it will be identical and ready to push and use immediately!

If you re-run this command on an existing directory it will leave existing files alone and not clobber them.

You'll need to do a \`zapier push\` before the new version is visible in the editor, but otherwise you're good to go.`;

ConvertCommand.skipValidInstallCheck = true;

module.exports = ConvertCommand;
