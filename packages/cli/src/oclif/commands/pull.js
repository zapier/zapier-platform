const ZapierBaseCommand = require('../ZapierBaseCommand');
const { downloadSourceZip } = require('../../utils/api');
const {
  ensureDir,
  copyDir,
  makeTempDir,
  removeDir,
  validateFileExists,
} = require('../../utils/files');
const AdmZip = require('adm-zip');
const colors = require('colors/safe');
const constants = require('../../constants');
const { listFiles } = require('../../utils/build');
const { deleteUnignoredFiles } = require('../../utils/pull');
const { buildFlags } = require('../buildFlags');

class PullCommand extends ZapierBaseCommand {
  async perform() {
    if (
      !(await this.confirm(
        colors.yellow(
          'This will overwrite your local integration files with the latest version. Continue?'
        )
      ))
    ) {
      this.exit();
    }

    await downloadSourceZip();
    validateFileExists(constants.SOURCE_PATH);

    const tmpDir = makeTempDir();
    await ensureDir(tmpDir);

    const zip = new AdmZip(constants.SOURCE_PATH);
    zip.extractAllTo(tmpDir, true);

    const currentDir = process.cwd();
    const targetFiles = await listFiles(currentDir);

    await deleteUnignoredFiles(currentDir, targetFiles);

    // Copy everything else over
    await copyDir(tmpDir, currentDir, { clobber: true });
    await removeDir(tmpDir);

    this.log(colors.green('Pull completed successfully.'));
  }
}

PullCommand.flags = buildFlags();
PullCommand.description =
  'Pull the latest version of your integration from Zapier, updating your local integration files.';

module.exports = PullCommand;
