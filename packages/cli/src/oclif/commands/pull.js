const ZapierBaseCommand = require('../ZapierBaseCommand');
const { downloadSourceZip } = require('../../utils/api');
const { ensureDir, copyDir, makeTempDir, removeDir, validateFileExists, deleteUnmatchedFiles } = require('../../utils/files');
const AdmZip = require('adm-zip');
const colors = require('colors/safe');
const constants = require('../../constants');
const debug = require('debug')('zapier:pull');

class PullCommand extends ZapierBaseCommand {
  async perform() {
    if (
      !await this.confirm(colors.yellow('This will overwrite your local integration files with the latest version. Continue?'))
    ) {
      this.exit()
    }

    await downloadSourceZip();
    validateFileExists(constants.SOURCE_PATH)

    const tmpDir = makeTempDir()
    await ensureDir(tmpDir);
    debug('Using temp directory for source unzip: ', tmpDir);

    try {
      const zip = new AdmZip(constants.SOURCE_PATH)
      zip.extractAllTo(tmpDir, true)
    } catch (e) {
      console.error(`Failed to extract zip file: ${e}`);
    }

    // TODO: change destination
    await copyDir(tmpDir, 'example-target', {clobber: true})
    await deleteUnmatchedFiles(tmpDir, 'example-target');
    await removeDir(tmpDir);

    this.log(colors.green('Pull completed successfully.'));
  }
}

PullCommand.description = "Pull the latest version of your integration from Zapier, updating your local integration files."

module.exports = PullCommand;