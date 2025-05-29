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
      tmpDir,
    );

    // When releasing, the core version the example apps points can be still
    // non-existent. Let's make sure it points to the local one.
    corePackage = await npmPackCore();
    const appPackageJsonPath = path.join(tmpDir, 'package.json');
    const appPackageJson = JSON.parse(
      fs.readFileSync(appPackageJsonPath, { encoding: 'utf8' }),
    );
    appPackageJson.dependencies[PLATFORM_PACKAGE] = corePackage.path;
    fs.writeFileSync(appPackageJsonPath, JSON.stringify(appPackageJson));

    runCommand('npm', ['i'], { cwd: tmpDir });
    // TODO: This test depends on how "typescript" example is set up, which
    // isn't good. Should refactor not to rely on that.
    runCommand('npm', ['run', 'build', '--scripts-prepend-node-path'], {
      cwd: tmpDir,
    });
    entryPoint = path.resolve(tmpDir, 'index.js');
  });

  after(() => {
    fs.removeSync(tmpDir);
    corePackage.cleanup();
  });

  it('should list only required files', async function () {
    this.retries(3); // retry up to 3 times

    const smartPaths = await build.requiredFiles({
      cwd: tmpDir,
      entryPoints: [entryPoint],
    });
    // check that only the required lodash files are grabbed
    smartPaths.should.containEql('index.js');
    smartPaths.should.containEql('dist/index.js');
    smartPaths.should.containEql('dist/triggers/movie.js');

    smartPaths.filter((p) => p.endsWith('.ts')).length.should.equal(0);
    smartPaths.should.not.containEql('tsconfig.json');

    smartPaths.length.should.be.within(200, 305);
  });

  it('should list all the files', () => {
    return build.listFiles(tmpDir).then((dumbPaths) => {
      // check that way more than the required package files are grabbed
      dumbPaths.should.containEql('index.js');
      dumbPaths.should.containEql('dist/index.js');
      dumbPaths.should.containEql('dist/triggers/movie.js');

      dumbPaths.should.containEql('src/index.ts');
      dumbPaths.should.containEql('src/triggers/movie.ts');
      dumbPaths.should.containEql('tsconfig.json');

      dumbPaths.length.should.be.within(3000, 10000);
    });
  });

  it('list should not include blocklisted files', () => {
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
      "require('./index');",
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
          ({ path: filePath }) => filePath === 'index.js',
        );
        should.exist(indexFile);
        (indexFile.mode & 0o400).should.be.above(
          0,
          'no read permission for owner',
        );
        (indexFile.mode & 0o040).should.be.above(
          0,
          'no read permission for group',
        );
        (indexFile.mode & 0o004).should.be.above(
          0,
          'no read permission for public',
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
      "require('./index');",
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
          ({ path: filePath }) => filePath === 'index.js',
        );
        should.exist(indexFile);
        (indexFile.mode & 0o400).should.be.above(
          0,
          'no read permission for owner',
        );
        (indexFile.mode & 0o040).should.be.above(
          0,
          'no read permission for group',
        );
        (indexFile.mode & 0o004).should.be.above(
          0,
          'no read permission for public',
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
      "require('./index');",
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
          ({ path: filePath }) => filePath === 'index.js',
        );
        should.exist(indexFile);
        (indexFile.mode & 0o400).should.be.above(
          0,
          'no read permission for owner',
        );
        (indexFile.mode & 0o040).should.be.above(
          0,
          'no read permission for group',
        );
        (indexFile.mode & 0o004).should.be.above(
          0,
          'no read permission for public',
        );

        const readmeFile = files.find(
          ({ path: filePath }) => filePath === 'README.md',
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
      "require('./index');",
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
          ({ path: filePath }) => filePath === 'index.js',
        );
        should.exist(indexFile);

        const readmeFile = files.find(
          ({ path: filePath }) => filePath === 'README.md',
        );
        should.exist(readmeFile);

        const gitIgnoreFile = files.find(
          ({ path: filePath }) => filePath === '.gitignore',
        );
        should.not.exist(gitIgnoreFile);

        const testLogFile = files.find(
          ({ path: filePath }) => filePath === 'test.log',
        );
        should.not.exist(testLogFile);

        const DSStoreFile = files.find(
          ({ path: filePath }) => filePath === '.DS_Store',
        );
        should.not.exist(DSStoreFile);

        const environmentFile = files.find(
          ({ path: filePath }) => filePath === '.environment',
        );
        should.not.exist(environmentFile);
      });
  });

  it('should run the zapier-build script', async () => {
    runCommand('npm', ['run', 'clean'], { cwd: tmpDir });

    await build.maybeRunBuildScript({ cwd: tmpDir });

    const buildExists = await fs.pathExists(path.join(tmpDir, 'dist'));
    should.equal(buildExists, true);
  });
});

describe('build in workspaces', function () {
  let tmpDir, origCwd, coreVersion, corePackage;

  before(async () => {
    tmpDir = getNewTempDirPath();

    // Get absolute paths to local packages
    const corePath = path.resolve(__dirname, '../../../../core');
    const corePackageJsonPath = path.join(corePath, 'package.json');

    const originalPackageJsonText = fs.readFileSync(corePackageJsonPath, {
      encoding: 'utf8',
    });
    const corePackageJson = JSON.parse(originalPackageJsonText);

    // Get the actual version from the local core package
    coreVersion = corePackageJson.version;

    // Pack the local packages
    corePackage = await npmPackCore();

    // Set up a monorepo project structure with two integrations as npm
    // workspaces:
    //
    // (project root)
    // ├─ package.json
    // └── packages/
    //    ├─ app-1/
    //    │  ├─ index.js
    //    │  └─ package.json
    //    └─ app-2/
    // 	     ├─ index.js
    // 	     └─ package.json

    // Create root package.json
    fs.outputFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({
        name: 'my-monorepo',
        workspaces: ['packages/*'],
        private: true,
      }),
    );

    const defaultIndexJs = `module.exports = {
	version: require('./package.json').version,
	platformVersion: require('zapier-platform-core').version,
};`;

    // First integration: app-1
    fs.outputFileSync(
      path.join(tmpDir, 'packages', 'app-1', 'index.js'),
      defaultIndexJs,
    );
    fs.outputFileSync(
      path.join(tmpDir, 'packages', 'app-1', 'package.json'),
      JSON.stringify({
        name: 'app-1',
        version: '1.0.0',
        main: 'index.js',
        dependencies: {
          uuid: '8.3.2',
          'zapier-platform-core': corePackage.path,
        },
        private: true,
      }),
    );

    // Second integration: app-2
    fs.outputFileSync(
      path.join(tmpDir, 'packages', 'app-2', 'index.js'),
      defaultIndexJs,
    );
    fs.outputFileSync(
      path.join(tmpDir, 'packages', 'app-2', 'package.json'),
      JSON.stringify({
        name: 'app-2',
        version: '1.0.0',
        main: 'index.js',
        dependencies: {
          uuid: '9.0.1',
          'zapier-platform-core': corePackage.path,
        },
        private: true,
      }),
    );

    runCommand('yarn', ['install'], { cwd: tmpDir });
  });

  after(() => {
    fs.removeSync(tmpDir);
    corePackage.cleanup();
  });

  beforeEach(() => {
    origCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(origCwd);
  });

  it('should build in app-1', async () => {
    const workspaceDir = path.join(tmpDir, 'packages', 'app-1');
    const zipPath = path.join(workspaceDir, 'build', 'build.zip');
    const unzipPath = path.join(tmpDir, 'build', 'build');

    // Make sure the zapier-platform-core dependency is installed in the root
    // project directory
    fs.existsSync(
      path.join(tmpDir, 'node_modules', 'zapier-platform-core'),
    ).should.be.true();
    fs.existsSync(
      path.join(workspaceDir, 'node_modules', 'zapier-platform-core'),
    ).should.be.false();

    fs.ensureDirSync(path.dirname(zipPath));

    process.chdir(workspaceDir);

    await build.buildAndOrUpload(
      { build: true, upload: false },
      {
        skipNpmInstall: true,
        skipValidation: true,
        printProgress: false,
        checkOutdated: false,
      },
    );
    await decompress(zipPath, unzipPath);

    const corePackageJson = JSON.parse(
      fs.readFileSync(
        path.join(
          unzipPath,
          'node_modules',
          'zapier-platform-core',
          'package.json',
        ),
      ),
    );
    corePackageJson.version.should.equal(coreVersion);

    const uuidPackageJson = JSON.parse(
      fs.readFileSync(
        path.join(unzipPath, 'node_modules', 'uuid', 'package.json'),
      ),
    );
    uuidPackageJson.version.should.equal('8.3.2');

    // Make sure node_modules/app-1 and node_modules/app-2 are not included
    // in the build
    fs.existsSync(
      path.join(unzipPath, 'node_modules', 'app-1'),
    ).should.be.false();
    fs.existsSync(
      path.join(unzipPath, 'node_modules', 'app-2'),
    ).should.be.false();
  });

  it('should build in app-2', async () => {
    const workspaceDir = path.join(tmpDir, 'packages', 'app-2');
    const zipPath = path.join(workspaceDir, 'build', 'build.zip');
    const unzipPath = path.join(tmpDir, 'build', 'build');

    // Make sure the zapier-platform-core dependency is installed in the root
    // project directory
    fs.existsSync(
      path.join(tmpDir, 'node_modules', 'zapier-platform-core'),
    ).should.be.true();
    fs.existsSync(
      path.join(workspaceDir, 'node_modules', 'zapier-platform-core'),
    ).should.be.false();

    fs.ensureDirSync(path.dirname(zipPath));

    process.chdir(workspaceDir);

    await build.buildAndOrUpload(
      { build: true, upload: false },
      {
        skipNpmInstall: true,
        skipValidation: true,
        printProgress: false,
        checkOutdated: false,
      },
    );
    await decompress(zipPath, unzipPath);

    const corePackageJson = JSON.parse(
      fs.readFileSync(
        path.join(
          unzipPath,
          'node_modules',
          'zapier-platform-core',
          'package.json',
        ),
      ),
    );
    corePackageJson.version.should.equal(coreVersion);

    const uuidPackageJson = JSON.parse(
      fs.readFileSync(
        path.join(unzipPath, 'node_modules', 'uuid', 'package.json'),
      ),
    );
    uuidPackageJson.version.should.equal('9.0.1');

    // Make sure node_modules/app-1 and node_modules/app-2 are not included
    // in the build
    fs.existsSync(
      path.join(unzipPath, 'node_modules', 'app-1'),
    ).should.be.false();
    fs.existsSync(
      path.join(unzipPath, 'node_modules', 'app-2'),
    ).should.be.false();
  });
});

describe('build ESM (runs slowly)', function () {
  let tmpDir, entryPoint, corePackage;

  before(async () => {
    // basically does what `zapier init` does
    tmpDir = getNewTempDirPath();
    await copyDir(
      path.resolve(__dirname, '../../../../../example-apps/typescript-esm'),
      tmpDir,
    );

    // When releasing, the core version the example apps points can be still
    // non-existent. Let's make sure it points to the local one.
    corePackage = await npmPackCore();
    const appPackageJsonPath = path.join(tmpDir, 'package.json');
    const appPackageJson = JSON.parse(
      fs.readFileSync(appPackageJsonPath, { encoding: 'utf8' }),
    );
    appPackageJson.dependencies[PLATFORM_PACKAGE] = corePackage.path;
    fs.writeFileSync(appPackageJsonPath, JSON.stringify(appPackageJson));

    runCommand('npm', ['i'], { cwd: tmpDir });
    // TODO: This test depends on how "typescript" example is set up, which
    // isn't good. Should refactor not to rely on that.
    runCommand('npm', ['run', 'build', '--scripts-prepend-node-path'], {
      cwd: tmpDir,
    });
    entryPoint = path.resolve(tmpDir, 'dist', 'index.js');
  });

  after(() => {
    fs.removeSync(tmpDir);
    corePackage.cleanup();
  });

  it('should list only required files', async function () {
    this.retries(3); // retry up to 3 times

    const smartPaths = await build.requiredFiles({
      cwd: tmpDir,
      entryPoints: [entryPoint],
    });
    // check that only the required lodash files are grabbed
    smartPaths.should.containEql('dist/index.js');
    smartPaths.should.containEql('dist/triggers/movie.js');

    smartPaths.filter((p) => p.endsWith('.ts')).length.should.equal(0);
    smartPaths.should.not.containEql('tsconfig.json');

    smartPaths.length.should.be.within(200, 305);
  });

  it('should list all the files', () => {
    return build.listFiles(tmpDir).then((dumbPaths) => {
      // check that way more than the required package files are grabbed
      dumbPaths.should.containEql('dist/index.js');
      dumbPaths.should.containEql('dist/triggers/movie.js');

      dumbPaths.should.containEql('src/index.ts');
      dumbPaths.should.containEql('src/triggers/movie.ts');
      dumbPaths.should.containEql('tsconfig.json');

      dumbPaths.length.should.be.within(3000, 10000);
    });
  });

  it('list should not include blocklisted files', () => {
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
      "console.log('hello!')",
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
          ({ path: filePath }) => filePath === 'index.js',
        );
        should.exist(indexFile);
        (indexFile.mode & 0o400).should.be.above(
          0,
          'no read permission for owner',
        );
        (indexFile.mode & 0o040).should.be.above(
          0,
          'no read permission for group',
        );
        (indexFile.mode & 0o004).should.be.above(
          0,
          'no read permission for public',
        );
      });
  });

  it('should run the zapier-build script', async () => {
    runCommand('npm', ['run', 'clean'], { cwd: tmpDir });

    await build.maybeRunBuildScript({ cwd: tmpDir });

    const buildExists = await fs.pathExists(path.join(tmpDir, 'dist'));
    should.equal(buildExists, true);
  });
});
