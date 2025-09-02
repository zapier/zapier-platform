const AdmZip = require('adm-zip');
const { ensureFileSync } = require('fs-extra');
const path = require('path');
const yeoman = require('yeoman-environment');

const ZapierBaseCommand = require('../ZapierBaseCommand');
const { downloadSourceZip } = require('../../utils/api');
const { ensureDir, makeTempDir, removeDirSync } = require('../../utils/files');
const { walkDirWithPresetBlocklist } = require('../../utils/build');
const { buildFlags } = require('../buildFlags');
const PullGenerator = require('../../generators/pull');

const listFiles = (dir) => {
  const relPaths = [];
  for (const entry of walkDirWithPresetBlocklist(dir)) {
    relPaths.push(path.join(path.relative(dir, entry.parentPath), entry.name));
  }
  return relPaths;
};

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
      const sourceFiles = listFiles(srcDst);

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
PullCommand.description = `Retrieve and update your local integration files with the promoted version (or latest version if not public).

This command updates your local integration files with the promoted version (or latest version if not public). You will be prompted with a confirmation dialog before continuing if there any destructive file changes.

Zapier may release new versions of your integration with bug fixes or new features. In the event this occurs, you will be unable to do the following until your local files are updated by running \`zapier pull\`:

* push to the promoted version
* promote a new version
* migrate users from one version to another`;

PullCommand.skipValidInstallCheck = true;

module.exports = PullCommand;
