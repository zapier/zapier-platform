const should = require('should');

const crypto = require('crypto');
const os = require('os');
const path = require('path');

const build = require('../../utils/build');
const { copyDir } = require('../../utils/files');
const { runCommand } = require('../_helpers');

const decompress = require('decompress');
const fs = require('fs');
const fse = require('fs-extra');

describe('build', () => {
  let tmpDir, entryPoint;
  before(async () => {
    // basically does what `zapier init` does
    const osTmpDir = fse.realpathSync(os.tmpdir());
    tmpDir = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex')
    );
    await copyDir(
      path.resolve(__dirname, '../../../../../example-apps/typescript'),
      tmpDir
    );
    // tests depend on live npm install, which isn't great. Does make for a nice isolated test though!
    // the typescript app builds on install
    await runCommand('npm', ['i'], { cwd: tmpDir });
    entryPoint = path.resolve(tmpDir, 'index.js');
  });

  it('should list only required files', () => {
    return build.requiredFiles(tmpDir, [entryPoint]).then(smartPaths => {
      // check that only the required lodash files are grabbed
      smartPaths.should.containEql('index.js');
      smartPaths.should.containEql('lib/index.js');
      smartPaths.should.containEql('lib/resources/recipe.js');

      smartPaths.filter(p => p.endsWith('.ts')).length.should.equal(0);
      smartPaths.should.not.containEql('tsconfig.json');

      smartPaths.length.should.be.within(200, 300);
    });
  });

  it('should list all the files', () => {
    return build.listFiles(tmpDir).then(dumbPaths => {
      // check that way more than the required package files are grabbed
      dumbPaths.should.containEql('index.js');
      dumbPaths.should.containEql('lib/index.js');
      dumbPaths.should.containEql('lib/resources/recipe.js');

      dumbPaths.should.containEql('src/index.ts');
      dumbPaths.should.containEql('src/resources/recipe.ts');
      dumbPaths.should.containEql('tsconfig.json');

      dumbPaths.length.should.be.within(1500, 2000);
    });
  });

  after(() => {
    fse.removeSync(tmpDir);
  });

  it('list should not include blacklisted files', () => {
    const osTmpDir = fse.realpathSync(os.tmpdir());
    const tmpProjectDir = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex')
    );

    [
      'safe.js',
      '.env',
      '.environment',
      '.git/HEAD',
      'build/the-build.zip'
    ].forEach(file => {
      const fileDir = file.split(path.sep);
      fileDir.pop();
      if (fileDir.length > 0) {
        fse.ensureDirSync(path.join(tmpProjectDir, fileDir.join(path.sep)));
      }
      fse.outputFileSync(path.join(tmpProjectDir, file), 'the-file');
    });

    return build.listFiles(tmpProjectDir).then(dumbPaths => {
      dumbPaths.should.containEql('safe.js');
      dumbPaths.should.not.containEql('.env');
      dumbPaths.should.not.containEql('build/the-build.zip');
      dumbPaths.should.not.containEql('.environment');
      dumbPaths.should.not.containEql('.git/HEAD');
    });
  });

  it('should make a build.zip', () => {
    const osTmpDir = fse.realpathSync(os.tmpdir());
    const tmpProjectDir = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex')
    );
    const tmpZipPath = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex'),
      'build.zip'
    );
    const tmpUnzipPath = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex')
    );
    const tmpIndexPath = path.join(tmpProjectDir, 'index.js');

    fse.outputFileSync(
      path.join(tmpProjectDir, 'zapierwrapper.js'),
      "console.log('hello!')"
    );
    fse.outputFileSync(tmpIndexPath, "console.log('hello!')");
    fs.chmodSync(tmpIndexPath, 0o700);
    fse.outputFileSync(path.join(tmpProjectDir, '.zapierapprc'), '{}');
    fse.ensureDirSync(path.dirname(tmpZipPath));

    global.argOpts = {};

    return build
      .makeZip(tmpProjectDir, tmpZipPath)
      .then(() => decompress(tmpZipPath, tmpUnzipPath))
      .then(files => {
        files.length.should.equal(2);

        const indexFile = files.find(
          ({ path: filePath }) => filePath === 'index.js'
        );
        should.exist(indexFile);
        (indexFile.mode & 0o400).should.be.above(
          0,
          'no read permission for owner'
        );
        (indexFile.mode & 0o040).should.be.above(
          0,
          'no read permission for group'
        );
        (indexFile.mode & 0o004).should.be.above(
          0,
          'no read permission for public'
        );
      });
  });

  it('should make a build.zip without .zapierapprc', () => {
    const osTmpDir = fse.realpathSync(os.tmpdir());
    const tmpProjectDir = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex')
    );
    const tmpZipPath = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex'),
      'build.zip'
    );
    const tmpUnzipPath = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex')
    );
    const tmpIndexPath = path.join(tmpProjectDir, 'index.js');

    fse.outputFileSync(
      path.join(tmpProjectDir, 'zapierwrapper.js'),
      "console.log('hello!')"
    );
    fse.outputFileSync(tmpIndexPath, "console.log('hello!')");
    fs.chmodSync(tmpIndexPath, 0o700);
    fse.ensureDirSync(path.dirname(tmpZipPath));

    global.argOpts = {};

    return build
      .makeZip(tmpProjectDir, tmpZipPath)
      .then(() => decompress(tmpZipPath, tmpUnzipPath))
      .then(files => {
        files.length.should.equal(2);

        const indexFile = files.find(
          ({ path: filePath }) => filePath === 'index.js'
        );
        should.exist(indexFile);
        (indexFile.mode & 0o400).should.be.above(
          0,
          'no read permission for owner'
        );
        (indexFile.mode & 0o040).should.be.above(
          0,
          'no read permission for group'
        );
        (indexFile.mode & 0o004).should.be.above(
          0,
          'no read permission for public'
        );
      });
  });

  it('should make a source.zip without .gitignore', () => {
    const osTmpDir = fse.realpathSync(os.tmpdir());
    const tmpProjectDir = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex')
    );
    const tmpZipPath = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex'),
      'source.zip'
    );
    const tmpUnzipPath = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex')
    );
    const tmpIndexPath = path.join(tmpProjectDir, 'index.js');
    const tmpReadmePath = path.join(tmpProjectDir, 'README.md');
    const tmpZapierAppPath = path.join(tmpProjectDir, '.zapierapprc');

    fse.outputFileSync(
      path.join(tmpProjectDir, 'zapierwrapper.js'),
      "console.log('hello!')"
    );
    fse.outputFileSync(tmpIndexPath, "console.log('hello!')");
    fse.outputFileSync(tmpReadmePath, 'README');
    fs.chmodSync(tmpIndexPath, 0o700);
    fse.outputFileSync(tmpZapierAppPath, '{}');
    fse.ensureDirSync(path.dirname(tmpZipPath));

    global.argOpts = {};

    return build
      .makeSourceZip(tmpProjectDir, tmpZipPath)
      .then(() => decompress(tmpZipPath, tmpUnzipPath))
      .then(files => {
        files.length.should.equal(4);

        const indexFile = files.find(
          ({ path: filePath }) => filePath === 'index.js'
        );
        should.exist(indexFile);
        (indexFile.mode & 0o400).should.be.above(
          0,
          'no read permission for owner'
        );
        (indexFile.mode & 0o040).should.be.above(
          0,
          'no read permission for group'
        );
        (indexFile.mode & 0o004).should.be.above(
          0,
          'no read permission for public'
        );

        const readmeFile = files.find(
          ({ path: filePath }) => filePath === 'README.md'
        );
        should.exist(readmeFile);
      });
  });

  it('should make a source.zip with .gitignore', () => {
    const osTmpDir = fse.realpathSync(os.tmpdir());
    const tmpProjectDir = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex')
    );
    const tmpZipPath = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex'),
      'source.zip'
    );
    const tmpUnzipPath = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex')
    );
    const tmpIndexPath = path.join(tmpProjectDir, 'index.js');
    const tmpReadmePath = path.join(tmpProjectDir, 'README.md');
    const tmpZapierAppPath = path.join(tmpProjectDir, '.zapierapprc');
    const tmpGitIgnorePath = path.join(tmpProjectDir, '.gitignore');
    const tmpTestLogPath = path.join(tmpProjectDir, 'test.log');
    const tmpDSStorePath = path.join(tmpProjectDir, '.DS_Store');
    const tmpEnvironmentPath = path.join(tmpProjectDir, '.environment');

    fse.outputFileSync(
      path.join(tmpProjectDir, 'zapierwrapper.js'),
      "console.log('hello!')"
    );
    fse.outputFileSync(tmpIndexPath, "console.log('hello!')");
    fs.chmodSync(tmpIndexPath, 0o700);
    fse.outputFileSync(tmpReadmePath, 'README');
    fse.outputFileSync(tmpZapierAppPath, '{}');
    fse.outputFileSync(tmpGitIgnorePath, '.DS_Store\n*.log');
    fse.outputFileSync(tmpTestLogPath, 'Something');
    fse.outputFileSync(tmpDSStorePath, 'Something Else');
    fse.outputFileSync(tmpEnvironmentPath, 'ZAPIER_TOKEN=YEAH');
    fse.ensureDirSync(path.dirname(tmpZipPath));

    global.argOpts = {};

    return build
      .makeSourceZip(tmpProjectDir, tmpZipPath)
      .then(() => decompress(tmpZipPath, tmpUnzipPath))
      .then(files => {
        files.length.should.equal(4);

        const indexFile = files.find(
          ({ path: filePath }) => filePath === 'index.js'
        );
        should.exist(indexFile);

        const readmeFile = files.find(
          ({ path: filePath }) => filePath === 'README.md'
        );
        should.exist(readmeFile);

        const gitIgnoreFile = files.find(
          ({ path: filePath }) => filePath === '.gitignore'
        );
        should.not.exist(gitIgnoreFile);

        const testLogFile = files.find(
          ({ path: filePath }) => filePath === 'test.log'
        );
        should.not.exist(testLogFile);

        const DSStoreFile = files.find(
          ({ path: filePath }) => filePath === '.DS_Store'
        );
        should.not.exist(DSStoreFile);

        const environmentFile = files.find(
          ({ path: filePath }) => filePath === '.environment'
        );
        should.not.exist(environmentFile);
      });
  });
});
