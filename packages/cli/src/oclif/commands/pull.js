const AdmZip = require('adm-zip');
const { ensureFileSync } = require('fs-extra');
const path = require('path');
const yeoman = require('yeoman-environment');

const ZapierBaseCommand = require('../ZapierBaseCommand');
const { downloadSourceZip } = require('../../utils/api');
const { ensureDir, makeTempDir, removeDirSync } = require('../../utils/files');
const { listFiles } = require('../../utils/build');
const { buildFlags } = require('../buildFlags');
const PullGenerator = require('../../generators/pull');

class PullCommand extends ZapierBaseCommand {
  async perform() {
    // Fetch the source zip from API
    const tmpDir = makeTempDir();
    const srcZipDst = path.join(tmpDir, 'download', 'source.zip');

    try {
      ensureFileSync(srcZipDst);
      await downloadSourceZip(srcZipDst);

      // Write source zip to tmp dir
      const srcDst = path.join(tmpDir, 'source');
      await ensureDir(srcDst);
      const zip = new AdmZip(srcZipDst);
      zip.extractAllTo(srcDst, true);

      // Prompt user to confirm overwrite
      const currentDir = process.cwd();
      const sourceFiles = await listFiles(srcDst);

      const env = yeoman.createEnv();
      const namespace = 'zapier:pull';
      env.registerStub(PullGenerator, namespace);
      await env.run(namespace, {
        sourceFiles,
        srcDir: srcDst,
        dstDir: currentDir,
      });
    } finally {
      removeDirSync(tmpDir);
    }
  }
}

PullCommand.flags = buildFlags();
PullCommand.description =
  'Pull the source code of the latest version of your integration from Zapier, overwriting your local integration files.';
PullCommand.skipValidInstallCheck = true;

module.exports = PullCommand;
