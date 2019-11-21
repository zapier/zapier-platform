const ZapierBaseCommand = require('../ZapierBaseCommand');
const { BUILD_PATH, SOURCE_PATH } = require('../../constants');

const BuildCommand = require('./build');

const { buildAndOrUpload } = require('../../utils/build');

class PushCommand extends ZapierBaseCommand {
  async perform() {
    this.log('Pushing Project\n');

    await buildAndOrUpload(
      { build: true, upload: true },
      {
        skipNpmInstall: this.flags['skip-npm-install'],
        disableDependencyDetection: this.flags['disable-dependency-detection']
      }
    );
    await this.log(
      `\nPush complete! Built ${BUILD_PATH} and ${SOURCE_PATH} and uploaded them to Zapier.`
    );
  }
}

PushCommand.flags = BuildCommand.flags;
PushCommand.description = `Builds and uploads the current app.

This command is the same as running \`zapier build\` and \`zapier upload\` in sequence. See those for more info.`;

module.exports = PushCommand;
