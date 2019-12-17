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
          this.stopSpinner();
          this.logJSON(appInfo);
          this.logJSON(versionInfo);
          return convertVisualApp(
            appInfo,
            versionInfo.definition_override,
            tempAppDir
          );
        } catch (e) {
          if (e.status === 404) {
            this.error(
              `Visual Builder integration ${appId} @ ${version} not found. If you want to convert a Legacy Web Builder app, don't pass a \`--version\` option.`
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
ConvertCommand.description = `Describes the current integraiton.

Prints a human readable enumeration of your integrations's triggers, searches, and creates as seen by Zapier. Useful to understand how your resources convert and relate to different actions.

* \`Noun\` -- your action's noun
* \`Label\` -- your action's label
* \`Resource\` -- the resource (if any) this action is tied to
* \`Available Methods\` -- testable methods for this action`;

module.exports = ConvertCommand;
