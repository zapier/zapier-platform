const ZapierBaseCommand = require('../ZapierBaseCommand');
const { BUILD_PATH, SOURCE_PATH } = require('../../constants');
const { Flags } = require('@oclif/core');

const BuildCommand = require('./build');

const { buildAndOrUpload } = require('../../utils/build');

class PushCommand extends ZapierBaseCommand {
  async perform() {
    await buildAndOrUpload(
      { build: true, upload: true },
      {
        skipNpmInstall: this.flags['skip-npm-install'],
        disableDependencyDetection: this.flags['disable-dependency-detection'],
        skipValidation: this.flags['skip-validation'],
        overwritePartnerChanges: this.flags['overwrite-partner-changes'],
      },
    );
    this.log(
      `\nPush complete! Built ${BUILD_PATH} and ${SOURCE_PATH} and uploaded them to Zapier.`,
    );
  }
}

PushCommand.flags = {
  ...BuildCommand.flags,
  'overwrite-partner-changes': Flags.boolean({
    description:
      '(Internal Use Only) Allows Zapier Staff to push changes to integrations in certain situations.',
    hidden: true,
  }),
};
PushCommand.description = `Build and upload the current integration.

This command is the same as running \`zapier build\` and \`zapier upload\` in sequence. See those for more info.`;

module.exports = PushCommand;
