const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

const { BUILD_PATH, SOURCE_PATH } = require('../../constants');

const { buildAndOrUpload } = require('../../utils/build');

class UploadCommand extends BaseCommand {
  async perform() {
    // it would be cool if we differentiated between new/updated here
    await buildAndOrUpload({ upload: true });
    this.log(
      `\nUpload complete! Uploaded ${BUILD_PATH} and ${SOURCE_PATH} to Zapier. If it's a new version, it should now be available in the Zap editor.`,
    );
  }
}

UploadCommand.skipValidInstallCheck = true;
UploadCommand.flags = buildFlags();
UploadCommand.description = `Upload the latest build of your integration to Zapier.

This command sends both ${BUILD_PATH} and ${SOURCE_PATH} to Zapier for use.

Typically we recommend using \`zapier push\`, which does a build and upload, rather than \`upload\` by itself.
`;

module.exports = UploadCommand;
