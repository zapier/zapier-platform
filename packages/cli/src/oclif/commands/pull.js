const AdmZip = require('adm-zip');
const { ensureFileSync } = require('fs-extra');
const path = require('path');
const yeoman = require('yeoman-environment');

const ZapierBaseCommand = require('../ZapierBaseCommand');
const { downloadSourceZip } = require('../../utils/api');
const { ensureDir, makeTempDir } = require('../../utils/files');
const { listFiles } = require('../../utils/build');
const { buildFlags } = require('../buildFlags');
const PullGenerator = require('../../generators/pull');
const { respectGitIgnore, isBlocklisted } = require('../../utils/ignore');

// Some files were ignored during the original build step
// This includes anything declared in .gitignore, the file itsefl or blocklisted paths
const getDeletableFiles = async (dir, targetFiles) => {
  const ignoredFiles = respectGitIgnore(dir, targetFiles);

  const keepFiles = targetFiles.filter(
    (file) =>
      !ignoredFiles.includes(file) ||
      file === '.gitignore' ||
      isBlocklisted(file)
  );

  return targetFiles.filter((file) => !keepFiles.includes(file));
};

class PullCommand extends ZapierBaseCommand {
  async perform() {
    // Fetch the source zip from API
    const tmpDir = makeTempDir();
    const srcZipDst = path.join(tmpDir, 'download', 'source.zip');
    await ensureFileSync(srcZipDst);
    await downloadSourceZip(srcZipDst);

    // Write source zip to tmp dir
    const srcDst = path.join(tmpDir, 'source');
    await ensureDir(srcDst);
    const zip = new AdmZip(srcZipDst);
    zip.extractAllTo(srcDst, true);

    // Prompt user to confirm overwrite
    const currentDir = process.cwd();
    const targetFiles = await listFiles(currentDir);
    const deletableFiles = await getDeletableFiles(currentDir, targetFiles);
    const sourceFiles = await listFiles(srcDst);

    const env = yeoman.createEnv();
    const namespace = 'zapier:pull';
    env.registerStub(PullGenerator, namespace);
    await env.run(
      namespace,
      { deletableFiles, sourceFiles, srcDir: srcDst, delDir: currentDir },
      () => {}
    );
  }
}

PullCommand.flags = buildFlags();
PullCommand.description =
  'Pull the source code of the latest version of your integration from Zapier, overwriting your local integration files.';

module.exports = PullCommand;
