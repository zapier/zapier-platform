const BaseCommand = require('../baseCommand');
const BuildCommand = require('./build');
// const buildFlags = require('../buildFlags');
const { build } = require('../utils/build');
const { upload } = require('../utils/upload');
const { BUILD_PATH, SOURCE_PATH } = require('../constants');

const dumbPathsFlag = 'disable-dependency-detection';
const mapFlag = 'include-js-map';

class PushCommand extends BaseCommand {
  async run() {
    this.flags = this.parse(PushCommand).flags;

    // TODO: don't repeat this. subclass BuildCommand maybe?
    const opts = {
      dumbPaths: Boolean(this.flags[dumbPathsFlag]),
      includeMaps: Boolean(this.flags[mapFlag])
    };

    context.line('Preparing to upload a new version.\n');

    this.definitelyLoggedIn();

    const paths = {
      zipPath: BUILD_PATH,
      sourceZipPath: SOURCE_PATH,
      appDir: '.' // TODO: fix this inconsistent param name between build and upload
    };
    await build(opts, paths);
    await upload(paths);

    context.line(
      `\nUpload of ${BUILD_PATH} and ${SOURCE_PATH} complete! Try \`zapier versions\` now!`
    );
  }
}

PushCommand.flags = BuildCommand.flags;

module.exports = PushCommand;
