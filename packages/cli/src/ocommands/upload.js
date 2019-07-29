const BaseCommand = require('../baseCommand');
const buildFlags = require('../buildFlags');
const { upload } = require('../utils/upload');
const { BUILD_PATH, SOURCE_PATH } = require('../constants');

class UploadCommand extends BaseCommand {
  async run() {
    this.flags = this.parse(UploadCommand).flags;

    context.line('Preparing to upload a new version.\n');

    await upload();

    context.line(
      `\nUpload of ${BUILD_PATH} and ${SOURCE_PATH} complete! Try \`zapier versions\` now!`
    );
  }
}

UploadCommand.flags = buildFlags();

module.exports = UploadCommand;
