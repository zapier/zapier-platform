const ZapierBaseCommand = require('../ZapierBaseCommand');
const { BUILD_PATH, SOURCE_PATH } = require('../../constants');
const { Flags } = require('@oclif/core');
const colors = require('colors/safe');

const BuildCommand = require('./build');

const { buildAndOrUpload } = require('../../utils/build');
class PushCommand extends ZapierBaseCommand {
  async perform() {
    const skipDepInstall = this.flags['skip-dep-install'];

    const snapshotLabel = this.flags.snapshot;
    if (snapshotLabel && snapshotLabel.length > 12) {
      throw new Error('Snapshot label cannot exceed 12 characters');
    }

    const snapshotVersion = snapshotLabel
      ? `0.0.0-${snapshotLabel}`
      : undefined;

    await buildAndOrUpload(
      { build: true, upload: true },
      {
        skipDepInstall,
        disableDependencyDetection: this.flags['disable-dependency-detection'],
        skipValidation: this.flags['skip-validation'],
        overwritePartnerChanges: this.flags['overwrite-partner-changes'],
      },
      snapshotVersion,
    );
    this.log(
      `\nPush complete! Built ${BUILD_PATH} and ${SOURCE_PATH} and uploaded them to Zapier.`,
    );

    if (!skipDepInstall) {
      this.log(
        `\nTip: Try ${colors.bold.underline('zapier push --skip-dep-install')} for faster builds.`,
      );
    }
  }
}

PushCommand.flags = {
  ...BuildCommand.flags,
  'overwrite-partner-changes': Flags.boolean({
    description:
      '(Internal Use Only) Allows Zapier Staff to push changes to integrations in certain situations.',
    hidden: true,
  }),
  snapshot: Flags.string({
    description:
      'Pass in a label to create a snapshot version of this integration for development and testing purposes. The version will be created as: 0.0.0-MY-LABEL',
  }),
};
PushCommand.examples = ['zapier push', 'zapier push --snapshot MY-LABEL'];
PushCommand.description = `Build and upload the current integration.

This command is the same as running \`zapier build\` and \`zapier upload\` in sequence. See those for more info.`;

module.exports = PushCommand;
