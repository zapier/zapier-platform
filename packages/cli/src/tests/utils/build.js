const fs = require('fs-extra');
const path = require('path');

const decompress = require('decompress');
const should = require('should');

const build = require('../../utils/build');
const { copyDir } = require('../../utils/files');
const { PLATFORM_PACKAGE } = require('../../constants');
const { runCommand, getNewTempDirPath, npmPackCore } = require('../_helpers');

describe('build (runs slowly)', function () {
  let tmpDir, entryPoint, corePackage;

  before(async () => {
    // basically does what `zapier init` does
    tmpDir = getNewTempDirPath();
    await copyDir(
      path.resolve(__dirname, '../../../../../example-apps/typescript'),
      tmpDir
    );

    // When releasing, the core version the example apps points can be still
    // non-existent. Let's make sure it points to the local one.
    corePackage = await npmPackCore();
    const appPackageJsonPath = path.join(tmpDir, 'package.json');
    const appPackageJson = JSON.parse(
      fs.readFileSync(appPackageJsonPath, { encoding: 'utf8' })
    );
    appPackageJson.dependencies[PLATFORM_PACKAGE] = corePackage.path;
    fs.writeFileSync(appPackageJsonPath, JSON.stringify(appPackageJson));

    runCommand('npm', ['i'], { cwd: tmpDir });
    // TODO: This test depends on how "typescript" example is set up, which
    // isn't good. Should refactor not to rely on that.
    runCommand('npm', ['run', 'build'], { cwd: tmpDir });
    entryPoint = path.resolve(tmpDir, 'index.js');
  });

  after(() => {
    fs.removeSync(tmpDir);
    corePackage.cleanup();
  });

  it('should list only required files', async function () {
    this.retries(3); // retry up to 3 times

    const smartPaths = await build.requiredFiles(tmpDir, [entryPoint]);

    // check that only the required lodash files are grabbed
    smartPaths.should.containEql('index.js');
    smartPaths.should.containEql('lib/index.js');
    smartPaths.should.containEql('lib/triggers/movie.js');

    smartPaths.filter((p) => p.endsWith('.ts')).length.should.equal(0);
    smartPaths.should.not.containEql('tsconfig.json');

    smartPaths.length.should.be.within(200, 300);
  });

  it('should list all the files', () => {
    return build.listFiles(tmpDir).then((dumbPaths) => {
      // check that way more than the required package files are grabbed
      dumbPaths.should.containEql('index.js');
      dumbPaths.should.containEql('lib/index.js');
      dumbPaths.should.containEql('lib/triggers/movie.js');

      dumbPaths.should.containEql('src/index.ts');
      dumbPaths.should.containEql('src/triggers/movie.ts');
      dumbPaths.should.containEql('tsconfig.json');

      dumbPaths.length.should.be.within(5000, 15000);
    });
  });

  it('list should not include blacklisted files', () => {
    const tmpProjectDir = getNewTempDirPath();

    [
      'safe.js',
      '.env',
      '.environment',
      '.git/HEAD',
      'build/the-build.zip',
    ].forEach((file) => {
      const fileDir = file.split(path.sep);
      fileDir.pop();
      if (fileDir.length > 0) {
        fs.ensureDirSync(path.join(tmpProjectDir, fileDir.join(path.sep)));
      }
      fs.outputFileSync(path.join(tmpProjectDir, file), 'the-file');
    });

    return build.listFiles(tmpProjectDir).then((dumbPaths) => {
      dumbPaths.should.containEql('safe.js');
      dumbPaths.should.not.containEql('.env');
      dumbPaths.should.not.containEql('build/the-build.zip');
      dumbPaths.should.not.containEql('.environment');
      dumbPaths.should.not.containEql('.git/HEAD');
    });
  });

  it('should make a build.zip', () => {
    const tmpProjectDir = getNewTempDirPath();
    const tmpZipPath = path.join(getNewTempDirPath(), 'build.zip');
    const tmpUnzipPath = getNewTempDirPath();
    const tmpIndexPath = path.join(tmpProjectDir, 'index.js');

    fs.outputFileSync(
      path.join(tmpProjectDir, 'zapierwrapper.js'),
      "console.log('hello!')"
    );
    fs.outputFileSync(tmpIndexPath, "console.log('hello!')");
    fs.chmodSync(tmpIndexPath, 0o700);
    fs.outputFileSync(path.join(tmpProjectDir, '.zapierapprc'), '{}');
    fs.ensureDirSync(path.dirname(tmpZipPath));

    global.argOpts = {};

    return build
      .makeZip(tmpProjectDir, tmpZipPath)
      .then(() => decompress(tmpZipPath, tmpUnzipPath))
      .then((files) => {
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
    const tmpProjectDir = getNewTempDirPath();
    const tmpZipPath = path.join(getNewTempDirPath(), 'build.zip');
    const tmpUnzipPath = getNewTempDirPath();
    const tmpIndexPath = path.join(tmpProjectDir, 'index.js');

    fs.outputFileSync(
      path.join(tmpProjectDir, 'zapierwrapper.js'),
      "console.log('hello!')"
    );
    fs.outputFileSync(tmpIndexPath, "console.log('hello!')");
    fs.chmodSync(tmpIndexPath, 0o700);
    fs.ensureDirSync(path.dirname(tmpZipPath));

    global.argOpts = {};

    return build
      .makeZip(tmpProjectDir, tmpZipPath)
      .then(() => decompress(tmpZipPath, tmpUnzipPath))
      .then((files) => {
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
    const tmpProjectDir = getNewTempDirPath();
    const tmpZipPath = path.join(getNewTempDirPath(), 'build.zip');
    const tmpUnzipPath = getNewTempDirPath();
    const tmpIndexPath = path.join(tmpProjectDir, 'index.js');
    const tmpReadmePath = path.join(tmpProjectDir, 'README.md');
    const tmpZapierAppPath = path.join(tmpProjectDir, '.zapierapprc');

    fs.outputFileSync(
      path.join(tmpProjectDir, 'zapierwrapper.js'),
      "console.log('hello!')"
    );
    fs.outputFileSync(tmpIndexPath, "console.log('hello!')");
    fs.outputFileSync(tmpReadmePath, 'README');
    fs.chmodSync(tmpIndexPath, 0o700);
    fs.outputFileSync(tmpZapierAppPath, '{}');
    fs.ensureDirSync(path.dirname(tmpZipPath));

    global.argOpts = {};

    return build
      .makeSourceZip(tmpProjectDir, tmpZipPath)
      .then(() => decompress(tmpZipPath, tmpUnzipPath))
      .then((files) => {
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
    const tmpProjectDir = getNewTempDirPath();
    const tmpZipPath = path.join(getNewTempDirPath(), 'build.zip');
    const tmpUnzipPath = getNewTempDirPath();

    const tmpIndexPath = path.join(tmpProjectDir, 'index.js');
    const tmpReadmePath = path.join(tmpProjectDir, 'README.md');
    const tmpZapierAppPath = path.join(tmpProjectDir, '.zapierapprc');
    const tmpGitIgnorePath = path.join(tmpProjectDir, '.gitignore');
    const tmpTestLogPath = path.join(tmpProjectDir, 'test.log');
    const tmpDSStorePath = path.join(tmpProjectDir, '.DS_Store');
    const tmpEnvironmentPath = path.join(tmpProjectDir, '.environment');

    fs.outputFileSync(
      path.join(tmpProjectDir, 'zapierwrapper.js'),
      "console.log('hello!')"
    );
    fs.outputFileSync(tmpIndexPath, "console.log('hello!')");
    fs.chmodSync(tmpIndexPath, 0o700);
    fs.outputFileSync(tmpReadmePath, 'README');
    fs.outputFileSync(tmpZapierAppPath, '{}');
    fs.outputFileSync(tmpGitIgnorePath, '.DS_Store\n*.log');
    fs.outputFileSync(tmpTestLogPath, 'Something');
    fs.outputFileSync(tmpDSStorePath, 'Something Else');
    fs.outputFileSync(tmpEnvironmentPath, 'ZAPIER_TOKEN=YEAH');
    fs.ensureDirSync(path.dirname(tmpZipPath));

    global.argOpts = {};

    return build
      .makeSourceZip(tmpProjectDir, tmpZipPath)
      .then(() => decompress(tmpZipPath, tmpUnzipPath))
      .then((files) => {
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

  it('should run the zapier-build script', async () => {
    runCommand('npm', ['run', 'clean'], { cwd: tmpDir });

    await build.maybeRunBuildScript({ cwd: tmpDir });

    const buildExists = await fs.pathExists(path.join(tmpDir, 'lib'));
    should.equal(buildExists, true);
  });
});
