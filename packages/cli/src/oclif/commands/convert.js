const { Args, Flags } = require('@oclif/core');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

const { callAPI } = require('../../utils/api');
const { convertApp } = require('../../utils/convert');
const { isExistingEmptyDir } = require('../../utils/files');
const { initApp } = require('../../utils/init');

class ConvertCommand extends BaseCommand {
  generateCreateFunc(appId, version) {
    return async (tempAppDir) => {
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
            `Integration ${appId} @ ${version} is already a CLI integration and can't be converted. Instead, pick a version that was created using the Visual Builder.`,
          );
        }
        this.stopSpinner();

        return convertApp(appInfo, versionInfo.definition_override, tempAppDir);
      } catch (e) {
        if (e.status === 404) {
          this.error(
            `Visual Builder integration ${appId} @ ${version} not found. Double check the integration id and version.`,
          );
        }
        this.error(e.json.errors[0]);
      }
    };
  }

  async perform() {
    const { integrationId: appId, path } = this.args;
    const { version } = this.flags;
    if (!appId) {
      this.error(
        'You must provide an integrationId. See zapier convert --help for more info.',
      );
    }

    if (
      (await isExistingEmptyDir(path)) &&
      !(await this.confirm(`Path "${path}" is not empty. Continue anyway?`))
    ) {
      this.exit();
    }

    await initApp(path, this.generateCreateFunc(appId, version));
  }
}

ConvertCommand.args = {
  integrationId: Args.string({
    description: `To get the integration/app ID, go to "https://developer.zapier.com", click on an integration, and copy the number directly after "/app/" in the URL.`,
    required: true,
    parse: (input) => Number(input),
  }),
  path: Args.string({
    description:
      'Relative to your current path - IE: `.` for current directory.',
    required: true,
  }),
};

ConvertCommand.flags = buildFlags({
  commandFlags: {
    version: Flags.string({
      char: 'v',
      description:
        'Convert a specific version. Required when converting a Visual Builder integration.',
      required: true,
    }),
  },
});

ConvertCommand.description = `Convert a Visual Builder integration to a CLI integration.

The resulting CLI integration will be identical to its Visual Builder version and ready to push and use immediately!

If you re-run this command on an existing directory it will leave existing files alone and not clobber them.

You'll need to do a \`zapier push\` before the new version is visible in the editor, but otherwise you're good to go.`;

ConvertCommand.skipValidInstallCheck = true;

module.exports = ConvertCommand;
