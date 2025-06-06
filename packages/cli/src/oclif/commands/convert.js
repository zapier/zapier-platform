const fs = require('node:fs/promises');

const { Args, Flags } = require('@oclif/core');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

const { callAPI } = require('../../utils/api');
const { convertApp } = require('../../utils/convert');
const { isExistingEmptyDir } = require('../../utils/files');
const { initApp } = require('../../utils/init');

const readStream = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return chunks.join('');
};

class ConvertCommand extends BaseCommand {
  generateCreateFunc(appId, version, json, title, description) {
    return async (tempAppDir) => {
      if (json) {
        const appInfo = {
          title,
          description,
        };

        let parsedDefinition = json;
        if (parsedDefinition.startsWith('@')) {
          const filePath = parsedDefinition.substr(1);
          let definitionStream;
          if (filePath === '-') {
            definitionStream = process.stdin;
          } else {
            const fd = await fs.open(filePath);
            definitionStream = fd.createReadStream({ encoding: 'utf8' });
          }
          parsedDefinition = await readStream(definitionStream);
        }
        parsedDefinition = JSON.parse(parsedDefinition);

        return convertApp(appInfo, parsedDefinition, tempAppDir);
      }

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
    const { path } = this.args;
    const {
      integrationId: appId,
      version,
      json,
      title,
      description,
    } = this.flags;

    if (
      (await isExistingEmptyDir(path)) &&
      !(await this.confirm(`Path "${path}" is not empty. Continue anyway?`))
    ) {
      this.exit();
    }

    if (!appId && !json) {
      this.error('You must provide either an integrationId or json.');
    }

    await initApp(
      path,
      this.generateCreateFunc(appId, version, json, title, description),
    );
  }
}

ConvertCommand.args = {
  path: Args.string({
    description:
      'Relative to your current path - IE: `.` for current directory.',
    required: true,
  }),
};

ConvertCommand.flags = buildFlags({
  commandFlags: {
    integrationId: Args.string({
      char: 'i',
      description: `To get the integration/app ID, go to "https://developer.zapier.com", click on an integration, and copy the number directly after "/app/" in the URL.`,
      required: false,
      dependsOn: ['version'],
      exclusive: ['definition'],
      parse: (input) => Number(input),
    }),
    version: Flags.string({
      char: 'v',
      description:
        'Convert a specific version. Required when converting a Visual Builder integration.',
      required: false,
      dependsOn: ['integrationId'],
    }),
    json: Flags.string({
      char: 'j',
      description:
        'The JSON definition to use, as alternative for reading from a Visual Builder integration. Must be a JSON-encoded object. The data can be passed from the command directly like \'{"key": "value"}\', read from a file like @file.json, or read from stdin like @-.',
      required: false,
      exclusive: ['integrationId'],
    }),
    title: Flags.string({
      char: 't',
      description:
        'The integration title, which will be snake-cased for the package.json name.',
      required: false,
      dependsOn: ['json'],
    }),
    description: Flags.string({
      char: 'd',
      description:
        'The integration description, which will be used for the package.json description.',
      required: false,
      dependsOn: ['json'],
    }),
  },
});

ConvertCommand.description = `Convert a Visual Builder integration to a CLI integration.

The resulting CLI integration will be identical to its Visual Builder version and ready to push and use immediately!

If you re-run this command on an existing directory it will leave existing files alone and not clobber them.

You'll need to do a \`zapier push\` before the new version is visible in the editor, but otherwise you're good to go.`;

ConvertCommand.skipValidInstallCheck = true;

module.exports = ConvertCommand;
