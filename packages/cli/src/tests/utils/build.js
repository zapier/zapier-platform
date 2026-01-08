const path = require('node:path');

const fs = require('fs-extra');
const should = require('should');

const build = require('../../utils/build');
const decompress = require('../../utils/decompress');
const { copyDir } = require('../../utils/files');
const { PLATFORM_PACKAGE } = require('../../constants');
const {
  IS_WINDOWS,
  getNewTempDirPath,
  npmPackCore,
  runCommand,
} = require('../_helpers');

function commonAncestor(pA, pB) {
  const partsA = pA.split(path.sep);
  const partsB = pB.split(path.sep);

  const length = Math.min(partsA.length, partsB.length);
  let i = 0;

  const equal = IS_WINDOWS
    ? (a, b) => a.toLowerCase() === b.toLowerCase()
    : (a, b) => a === b;

  while (i < length && equal(partsA[i], partsB[i])) {
    i++;
  }

  const commonPath = partsA.slice(0, i).join(path.sep);
  if (IS_WINDOWS) {
    if (!commonPath) {
      return 'C:\\';
    } else {
      return /^[a-zA-Z]:$/.test(commonPath) ? commonPath + '\\' : commonPath;
    }
  } else {
    return commonPath || '/';
  }
}

describe('build (runs slowly)', function () {
  let tmpDir, entryPoint, corePackage;

  before(async () => {
    // basically does what `zapier init` does
    tmpDir = getNewTempDirPath();
    await copyDir(
      path.resolve(__dirname, '../../../../../example-apps/oauth2'),
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

    runCommand('npm', ['install', '--ignore-scripts'], { cwd: tmpDir });
    entryPoint = path.resolve(tmpDir, 'index.js');
  });

  after(() => {
    fs.removeSync(tmpDir);
    corePackage.cleanup();
  });

  it('should list only required files', async function () {
    this.retries(3); // retry up to 3 times

    const smartPaths = await build.findRequiredFiles(tmpDir, [entryPoint]);
    // check that required integration files are grabbed
    smartPaths.should.containEql('index.js');
    smartPaths.should.containEql('authentication.js');

    // check that required package files are grabbed
    smartPaths.should.containEql(
      path.normalize('node_modules/zapier-platform-core/index.js'),
    );
    smartPaths.should.containEql(
      path.normalize('node_modules/node-fetch/lib/index.js'),
    );

    // check that unnecessary package files are omitted
    smartPaths.should.not.containEql(
      path.normalize('node_modules/jest/package.json'),
    );
    smartPaths.should.not.containEql(
      path.normalize('node_modules/node-fetch/README.md'),
    );

    smartPaths.length.should.be.within(200, 335);
  });

  it('should list all the files', () => {
    const dumbPaths = Array.from(build.walkDirWithPresetBlocklist(tmpDir)).map(
      (entry) => path.relative(tmpDir, path.join(entry.parentPath, entry.name)),
    );

    // check that required files are present
    dumbPaths.should.containEql('index.js');
    dumbPaths.should.containEql('authentication.js');
    dumbPaths.should.containEql(
      path.normalize('node_modules/zapier-platform-core/index.js'),
    );
    dumbPaths.should.containEql(
      path.normalize('node_modules/node-fetch/lib/index.js'),
    );

    // check that non-required files are also present
    dumbPaths.should.containEql(
      path.normalize('node_modules/jest/package.json'),
    );
    dumbPaths.should.containEql(path.normalize('node_modules/jest/README.md'));
    dumbPaths.should.containEql(
      path.normalize('node_modules/node-fetch/README.md'),
    );

    dumbPaths.length.should.be.within(3000, 10000);
  });

  it('list should not include blocklisted files', () => {
    const tmpProjectDir = getNewTempDirPath();

    [
      'safe.js',
      '.DS_Store',
      '.env',
      '.environment',
      `.git${path.sep}HEAD`,
      `build${path.sep}the-build.zip`,
    ].forEach((file) => {
      const fileDir = file.split(path.sep);
      fileDir.pop();
      if (fileDir.length > 0) {
        fs.ensureDirSync(path.join(tmpProjectDir, fileDir.join(path.sep)));
      }
      fs.outputFileSync(path.join(tmpProjectDir, file), 'the-file');
    });

    const dumbPaths = Array.from(
      build.walkDirWithPresetBlocklist(tmpProjectDir),
    ).map((entry) => {
      return path.relative(
        tmpProjectDir,
        path.join(entry.parentPath, entry.name),
      );
    });
    dumbPaths.should.containEql('safe.js');
    dumbPaths.should.not.containEql('.env');
    dumbPaths.should.not.containEql(path.normalize('build/the-build.zip'));
    dumbPaths.should.not.containEql('.environment');
    dumbPaths.should.not.containEql(path.normalize('.git/HEAD'));
    dumbPaths.should.not.containEql('.DS_Store');
  });

  it('should make a build.zip', async () => {
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
    fs.outputFileSync(
      path.join(tmpProjectDir, 'package.json'),
      JSON.stringify({
        name: 'test',
        version: '1.0.0',
        main: 'index.js',
      }),
    );
    fs.ensureDirSync(path.dirname(tmpZipPath));

    global.argOpts = {};

    await build.makeBuildZip(tmpProjectDir, tmpZipPath);

    const files = await decompress(tmpZipPath, tmpUnzipPath);
    files.length.should.equal(3);

    const indexFile = files.find(
      ({ path: filePath }) => filePath === 'index.js',
    );
    should.exist(indexFile);
    (indexFile.mode & 0o400).should.be.above(0, 'no read permission for owner');
    (indexFile.mode & 0o040).should.be.above(0, 'no read permission for group');
    (indexFile.mode & 0o004).should.be.above(
      0,
      'no read permission for public',
    );
  });

  it('should make a build.zip without .zapierapprc', async () => {
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
    fs.outputFileSync(
      path.join(tmpProjectDir, 'package.json'),
      JSON.stringify({
        name: 'test',
        version: '1.0.0',
        main: 'index.js',
      }),
    );
    fs.ensureDirSync(path.dirname(tmpZipPath));

    global.argOpts = {};

    await build.makeBuildZip(tmpProjectDir, tmpZipPath);
    const files = await decompress(tmpZipPath, tmpUnzipPath);
    files.length.should.equal(3);

    const indexFile = files.find(
      ({ path: filePath }) => filePath === 'index.js',
    );
    should.exist(indexFile);
    (indexFile.mode & 0o400).should.be.above(0, 'no read permission for owner');
    (indexFile.mode & 0o040).should.be.above(0, 'no read permission for group');
    (indexFile.mode & 0o004).should.be.above(
      0,
      'no read permission for public',
    );
  });

  it('should make a source.zip without .gitignore', async () => {
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

    await build.makeSourceZip(tmpProjectDir, tmpZipPath);
    const files = await decompress(tmpZipPath, tmpUnzipPath);

    const filePaths = new Set(files.map((file) => file.path));
    filePaths.should.deepEqual(
      new Set(['index.js', 'README.md', '.zapierapprc']),
    );

    const indexFile = files.find(
      ({ path: filePath }) => filePath === 'index.js',
    );
    should.exist(indexFile);
    (indexFile.mode & 0o400).should.be.above(0, 'no read permission for owner');
    (indexFile.mode & 0o040).should.be.above(0, 'no read permission for group');
    (indexFile.mode & 0o004).should.be.above(
      0,
      'no read permission for public',
    );
  });

  it('should make a source.zip with .gitignore', async () => {
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

    await build.makeSourceZip(tmpProjectDir, tmpZipPath);
    const files = await decompress(tmpZipPath, tmpUnzipPath);

    const filePaths = new Set(files.map((file) => file.path));
    filePaths.should.deepEqual(
      new Set(['index.js', 'README.md', '.zapierapprc', '.gitignore']),
    );
  });
});

// Set up a generic monorepo with two integrations and a common local package:
//
// (project root)
// ├─ package.json
// ├─ packages/
// │  ├─ app-1/
// │  │  ├─ index.js
// │  │  └─ package.json
// │  └─ app-2/
// │     ├─ index.js
// │     └─ package.json
// └─ common/
//    └─ hello/
//       ├─ index.js
//       └─ package.json
//
// where both app-1 and app-2 depend on the same local version of platform-core
// package and common/hello, but they use different versions of uuid.
const setupGenericMonorepo = async () => {
  const tmpDir = getNewTempDirPath();

  // Get absolute paths to local packages
  const corePath = path.resolve(__dirname, '../../../../core');
  const corePackageJsonPath = path.join(corePath, 'package.json');

  const originalPackageJsonText = fs.readFileSync(corePackageJsonPath, 'utf8');
  const corePackageJson = JSON.parse(originalPackageJsonText);

  // Get the actual version from the local core package
  const coreVersion = corePackageJson.version;

  // Pack the local packages
  const corePackage = await npmPackCore();

  // Create root package.json
  fs.outputFileSync(
    path.join(tmpDir, 'package.json'),
    JSON.stringify({
      name: 'my-monorepo',
      private: true,
    }),
  );

  // common-hello is a local package
  fs.outputFileSync(
    path.join(tmpDir, 'common', 'hello', 'index.js'),
    "module.exports = { hello: () => 'Hello from common!' };",
  );
  fs.outputFileSync(
    path.join(tmpDir, 'common', 'hello', 'package.json'),
    JSON.stringify({
      name: 'common-hello',
      version: '1.0.0',
      main: 'index.js',
      private: true,
    }),
  );

  // First integration: app-1, CJS, depending on uuid and common-hello
  fs.outputFileSync(
    path.join(tmpDir, 'packages', 'app-1', 'index.js'),
    `const uuid = require('uuid');
const { hello } = require('common-hello');
module.exports = {
	version: require('./package.json').version,
	platformVersion: require('zapier-platform-core').version,
};`,
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
        'common-hello': '1.0.0',
      },
      private: true,
    }),
  );

  // Second integration: app-2, an ESM, depending on uuid and common-hello
  fs.outputFileSync(
    path.join(tmpDir, 'packages', 'app-2', 'index.js'),
    `import { v4 as uuidv4 } from 'uuid';
import hello from 'common-hello';
import packageJson from './package.json' with { type: 'json' };
import zapier from 'zapier-platform-core';
export default {
  version: packageJson.version,
  platformVersion: zapier.version,
};`,
  );
  fs.outputFileSync(
    path.join(tmpDir, 'packages', 'app-2', 'package.json'),
    JSON.stringify({
      name: 'app-2',
      version: '1.0.0',
      exports: './index.js',
      dependencies: {
        uuid: '9.0.1',
        'zapier-platform-core': corePackage.path,
        'common-hello': '1.0.0',
      },
      type: 'module', // this makes app-1 an ESM
      private: true,
    }),
  );

  return {
    repoDir: tmpDir,
    corePackage: {
      version: coreVersion,
      path: corePackage.path,
    },
    cleanup: () => {
      fs.removeSync(tmpDir);
      corePackage.cleanup();
    },
  };
};

const setupLernaMonorepo = async () => {
  const monorepo = await setupGenericMonorepo();

  fs.outputFileSync(
    path.join(monorepo.repoDir, 'lerna.json'),
    JSON.stringify({
      packages: ['packages/*', 'common/*'],
      version: 'independent',
      npmClient: 'npm',
    }),
  );

  return monorepo;
};

const setupYarnMonorepo = async () => {
  const monorepo = await setupGenericMonorepo();

  // Root package.json. npm or yarn workspaces use the 'workspaces' field in
  // package.json.
  fs.outputFileSync(
    path.join(monorepo.repoDir, 'package.json'),
    JSON.stringify({
      name: 'my-monorepo',
      workspaces: ['packages/*', 'common/*'],
      private: true,
    }),
  );

  return monorepo;
};

const setupPnpmMonorepo = async () => {
  const monorepo = await setupGenericMonorepo();

  // pnpm has its own workspace file named pnpm-workspace.yaml
  fs.outputFileSync(
    path.join(monorepo.repoDir, 'pnpm-workspace.yaml'),
    `packages:
  - 'packages/*'
  - 'common/*'
linkWorkspacePackages: true`,
  );

  return monorepo;
};

describe('build in lerna monorepo', function () {
  let monorepo, origCwd, unzipDir;

  before(async () => {
    monorepo = await setupLernaMonorepo();

    // lerna@7 removed the bootstrap command, so we use lerna@6.
    // Lerna now actually recommends using the workspace feature from your
    // package manager, so this test suite is more of a regression test.
    runCommand('npx', ['lerna@6', 'bootstrap', '--no-ci'], {
      cwd: monorepo.repoDir,
    });
  });

  after(async () => {
    try {
      monorepo.cleanup();
    } catch (error) {
      if (!IS_WINDOWS) {
        // On Windows, somehow the cleanup can fail with EBUSY :shrug:
        throw error;
      }
    }
  });

  beforeEach(() => {
    origCwd = process.cwd();
    unzipDir = getNewTempDirPath();
  });

  afterEach(() => {
    process.chdir(origCwd);
    fs.removeSync(unzipDir);
    unzipDir = null;
  });

  it('should build in app-1', async () => {
    const appDir = path.join(monorepo.repoDir, 'packages', 'app-1');
    const zipPath = path.join(appDir, 'build', 'build.zip');

    process.chdir(appDir);

    await build.buildAndOrUpload(
      { build: true, upload: false },
      {
        skipDepInstall: true,
        skipValidation: true,
        printProgress: false,
        checkOutdated: false,
      },
    );
    await decompress(zipPath, unzipDir);

    // Root directory should have symlinks named zapierwrapper.js and index.js
    // linking to app-1/zapierwrapper.js and app-1/index.js respectively.
    const wrapperLinkPath = path.join(unzipDir, 'zapierwrapper.js');
    fs.lstatSync(wrapperLinkPath).isSymbolicLink().should.be.true();
    fs.readlinkSync(wrapperLinkPath).should.equal(
      path.join('packages', 'app-1', 'zapierwrapper.js'),
    );

    const indexLinkPath = path.join(unzipDir, 'index.js');
    fs.lstatSync(indexLinkPath).isSymbolicLink().should.be.true();
    fs.readlinkSync(indexLinkPath).should.equal(
      path.join('packages', 'app-1', 'index.js'),
    );

    // app-1/package.json should be copied to root directory
    const appPackageJson = fs.readJsonSync(path.join(unzipDir, 'package.json'));
    appPackageJson.name.should.equal('app-1');

    const corePackageJson = fs.readJsonSync(
      path.join(
        unzipDir,
        'packages',
        'app-1',
        'node_modules',
        'zapier-platform-core',
        'package.json',
      ),
    );
    corePackageJson.version.should.equal(monorepo.corePackage.version);

    const uuidPackageJson = fs.readJsonSync(
      path.join(
        unzipDir,
        'packages',
        'app-1',
        'node_modules',
        'uuid',
        'package.json',
      ),
    );
    uuidPackageJson.version.should.equal('8.3.2');

    // Make sure local dependency common-hello is included and symlinked
    fs.lstatSync(
      path.join(unzipDir, 'packages', 'app-1', 'node_modules', 'common-hello'),
    )
      .isSymbolicLink()
      .should.be.true();
    fs.realpathSync(
      path.join(unzipDir, 'packages', 'app-1', 'node_modules', 'common-hello'),
    ).should.equal(path.join(unzipDir, 'common', 'hello'));
    fs.existsSync(
      path.join(unzipDir, 'common', 'hello', 'index.js'),
    ).should.be.true();

    const helloPackageJson = fs.readJsonSync(
      path.join(unzipDir, 'common', 'hello', 'package.json'),
    );
    helloPackageJson.name.should.equal('common-hello');
    helloPackageJson.version.should.equal('1.0.0');
  });

  it('should build in app-2', async () => {
    const appDir = path.join(monorepo.repoDir, 'packages', 'app-2');
    const zipPath = path.join(appDir, 'build', 'build.zip');

    process.chdir(appDir);

    await build.buildAndOrUpload(
      { build: true, upload: false },
      {
        skipDepInstall: true,
        skipValidation: true,
        printProgress: false,
        checkOutdated: false,
      },
    );
    await decompress(zipPath, unzipDir);

    // Root directory should have symlinks named zapierwrapper.js and index.js
    // linking to app-2/zapierwrapper.js and app-2/index.js respectively.
    const wrapperLinkPath = path.join(unzipDir, 'zapierwrapper.js');
    fs.lstatSync(wrapperLinkPath).isSymbolicLink().should.be.true();
    fs.readlinkSync(wrapperLinkPath).should.equal(
      path.join('packages', 'app-2', 'zapierwrapper.js'),
    );

    const indexLinkPath = path.join(unzipDir, 'index.js');
    fs.lstatSync(indexLinkPath).isSymbolicLink().should.be.true();
    fs.readlinkSync(indexLinkPath).should.equal(
      path.join('packages', 'app-2', 'index.js'),
    );

    // app-2/package.json should be copied to root directory
    const appPackageJson = fs.readJsonSync(path.join(unzipDir, 'package.json'));
    appPackageJson.name.should.equal('app-2');

    const corePackageJson = fs.readJsonSync(
      path.join(
        unzipDir,
        'packages',
        'app-2',
        'node_modules',
        'zapier-platform-core',
        'package.json',
      ),
    );
    corePackageJson.version.should.equal(monorepo.corePackage.version);

    const uuidPackageJson = fs.readJsonSync(
      path.join(
        unzipDir,
        'packages',
        'app-2',
        'node_modules',
        'uuid',
        'package.json',
      ),
    );
    uuidPackageJson.version.should.equal('9.0.1');

    // Make sure local dependency common-hello is included and symlinked
    fs.lstatSync(
      path.join(unzipDir, 'packages', 'app-2', 'node_modules', 'common-hello'),
    )
      .isSymbolicLink()
      .should.be.true();
    fs.realpathSync(
      path.join(unzipDir, 'packages', 'app-2', 'node_modules', 'common-hello'),
    ).should.equal(path.join(unzipDir, 'common', 'hello'));
    fs.existsSync(
      path.join(unzipDir, 'common', 'hello', 'index.js'),
    ).should.be.true();

    const helloPackageJson = fs.readJsonSync(
      path.join(unzipDir, 'common', 'hello', 'package.json'),
    );
    helloPackageJson.name.should.equal('common-hello');
    helloPackageJson.version.should.equal('1.0.0');
  });
});

describe('build in yarn workspaces', function () {
  let monorepo, origCwd, unzipDir;

  before(async () => {
    monorepo = await setupYarnMonorepo();
    runCommand('yarn', ['install', '--ignore-scripts'], {
      cwd: monorepo.repoDir,
    });

    // Will be used to test yarn-linked zapier-platform-core package works
    runCommand('yarn', ['link'], {
      cwd: path.dirname(monorepo.corePackage.path),
      env: {
        ...process.env,
        // Workaround for yarn 1.22.21
        // https://github.com/yarnpkg/yarn/issues/9015
        // https://github.com/yarnpkg/yarn/commit/a84723816a81908214a5eb69fbf55fec0326b35a
        SKIP_YARN_COREPACK_CHECK: '1',
      },
    });
  });

  after(async () => {
    try {
      monorepo.cleanup();
    } catch (error) {
      if (!IS_WINDOWS) {
        // On Windows, somehow the cleanup can fail with EBUSY :shrug:
        throw error;
      }
    }
  });

  beforeEach(() => {
    origCwd = process.cwd();
    unzipDir = getNewTempDirPath();
  });

  afterEach(() => {
    process.chdir(origCwd);
    fs.removeSync(unzipDir);
    unzipDir = null;
  });

  it('should build in app-1', async () => {
    const appDir = path.join(monorepo.repoDir, 'packages', 'app-1');
    const zipPath = path.join(appDir, 'build', 'build.zip');

    // yarn hoists zapier-platform-core dependency to the root node_modules
    // directory
    fs.existsSync(
      path.join(monorepo.repoDir, 'node_modules', 'zapier-platform-core'),
    ).should.be.true();
    fs.existsSync(
      path.join(appDir, 'node_modules', 'zapier-platform-core'),
    ).should.be.false();

    fs.ensureDirSync(path.dirname(zipPath));

    process.chdir(appDir);

    await build.buildAndOrUpload(
      { build: true, upload: false },
      {
        skipDepInstall: true,
        skipValidation: true,
        printProgress: false,
        checkOutdated: false,
      },
    );
    await decompress(zipPath, unzipDir);

    // Root directory should have symlinks named zapierwrapper.js and index.js
    // linking to app-1/zapierwrapper.js and app-1/index.js respectively.
    const wrapperLinkPath = path.join(unzipDir, 'zapierwrapper.js');
    const indexLinkPath = path.join(unzipDir, 'index.js');
    fs.lstatSync(wrapperLinkPath).isSymbolicLink().should.be.true();
    fs.readlinkSync(wrapperLinkPath).should.equal(
      path.join('packages', 'app-1', 'zapierwrapper.js'),
    );

    fs.lstatSync(indexLinkPath).isSymbolicLink().should.be.true();
    fs.readlinkSync(indexLinkPath).should.equal(
      path.join('packages', 'app-1', 'index.js'),
    );

    // app-1/package.json should be copied to root directory
    const appPackageJson = fs.readJsonSync(path.join(unzipDir, 'package.json'));
    appPackageJson.name.should.equal('app-1');

    const corePackageJson = fs.readJsonSync(
      path.join(
        unzipDir,
        'node_modules',
        'zapier-platform-core',
        'package.json',
      ),
    );
    corePackageJson.version.should.equal(monorepo.corePackage.version);

    const uuidPackageJson = fs.readJsonSync(
      path.join(unzipDir, 'node_modules', 'uuid', 'package.json'),
    );
    uuidPackageJson.version.should.equal('8.3.2');

    // Make sure local dependency common-hello is included and symlinked
    fs.lstatSync(path.join(unzipDir, 'node_modules', 'common-hello'))
      .isSymbolicLink()
      .should.be.true();
    fs.realpathSync(
      path.join(unzipDir, 'node_modules', 'common-hello'),
    ).should.equal(path.join(unzipDir, 'common', 'hello'));
    fs.existsSync(
      path.join(unzipDir, 'common', 'hello', 'index.js'),
    ).should.be.true();
    fs.existsSync(
      path.join(unzipDir, 'common', 'hello', 'package.json'),
    ).should.be.true();

    const helloPackageJson = fs.readJsonSync(
      path.join(unzipDir, 'common', 'hello', 'package.json'),
    );
    helloPackageJson.name.should.equal('common-hello');
    helloPackageJson.version.should.equal('1.0.0');
  });

  it('should build in app-2', async () => {
    const appDir = path.join(monorepo.repoDir, 'packages', 'app-2');
    const zipPath = path.join(appDir, 'build', 'build.zip');

    // yarn hoists zapier-platform-core dependency to the root node_modules
    // directory
    fs.existsSync(
      path.join(monorepo.repoDir, 'node_modules', 'zapier-platform-core'),
    ).should.be.true();
    fs.existsSync(
      path.join(appDir, 'node_modules', 'zapier-platform-core'),
    ).should.be.false();

    fs.ensureDirSync(path.dirname(zipPath));

    process.chdir(appDir);

    await build.buildAndOrUpload(
      { build: true, upload: false },
      {
        skipDepInstall: true,
        skipValidation: true,
        printProgress: false,
        checkOutdated: false,
      },
    );
    await decompress(zipPath, unzipDir);

    // Root directory should have symlinks named zapierwrapper.js and index.js
    // linking to app-2/zapierwrapper.js and app-2/index.js respectively.
    const wrapperLinkPath = path.join(unzipDir, 'zapierwrapper.js');
    fs.lstatSync(wrapperLinkPath).isSymbolicLink().should.be.true();
    fs.readlinkSync(wrapperLinkPath).should.equal(
      path.join('packages', 'app-2', 'zapierwrapper.js'),
    );

    const indexLinkPath = path.join(unzipDir, 'index.js');
    fs.lstatSync(indexLinkPath).isSymbolicLink().should.be.true();
    fs.readlinkSync(indexLinkPath).should.equal(
      path.join('packages', 'app-2', 'index.js'),
    );

    // app-1/package.json should be copied to root directory
    const appPackageJson = fs.readJsonSync(path.join(unzipDir, 'package.json'));
    appPackageJson.name.should.equal('app-2');

    const corePackageJson = fs.readJsonSync(
      path.join(
        unzipDir,
        'node_modules',
        'zapier-platform-core',
        'package.json',
      ),
    );
    corePackageJson.version.should.equal(monorepo.corePackage.version);

    const uuidPackageJson = fs.readJsonSync(
      path.join(
        unzipDir,
        'packages',
        'app-2',
        'node_modules',
        'uuid',
        'package.json',
      ),
    );
    uuidPackageJson.version.should.equal('9.0.1');

    // Make sure local dependency common-hello is included and symlinked
    fs.lstatSync(path.join(unzipDir, 'node_modules', 'common-hello'))
      .isSymbolicLink()
      .should.be.true();
    fs.realpathSync(
      path.join(unzipDir, 'node_modules', 'common-hello'),
    ).should.equal(path.join(unzipDir, 'common', 'hello'));
    fs.existsSync(
      path.join(unzipDir, 'common', 'hello', 'index.js'),
    ).should.be.true();
    fs.existsSync(
      path.join(unzipDir, 'common', 'hello', 'package.json'),
    ).should.be.true();

    const helloPackageJson = fs.readJsonSync(
      path.join(unzipDir, 'common', 'hello', 'package.json'),
    );
    helloPackageJson.name.should.equal('common-hello');
    helloPackageJson.version.should.equal('1.0.0');
  });

  it('should build in app-2 with linked core', async () => {
    const appDir = path.join(monorepo.repoDir, 'packages', 'app-2');
    const coreDir = path.dirname(monorepo.corePackage.path);

    runCommand('yarn', ['link', 'zapier-platform-core'], { cwd: appDir });

    fs.lstatSync(path.join(appDir, 'node_modules', 'zapier-platform-core'))
      .isSymbolicLink()
      .should.be.true();
    fs.realpathSync(
      path.join(appDir, 'node_modules', 'zapier-platform-core'),
    ).should.equal(coreDir);

    const zipPath = path.join(appDir, 'build', 'build.zip');
    fs.ensureDirSync(path.dirname(zipPath));

    process.chdir(appDir);

    await build.buildAndOrUpload(
      { build: true, upload: false },
      {
        skipDepInstall: true,
        skipValidation: true,
        printProgress: false,
        checkOutdated: false,
      },
    );
    await decompress(zipPath, unzipDir);

    // `zapier build --skip-dep-install` uses the common ancestor of the app
    // directory (monorepo.repoDir) and the zapier-platform repo.
    // In GitHub's CI environment, zipRoot will be:
    // - '/' on Linux and macOS
    // - 'C:\' on Windows
    const zipRoot = commonAncestor(monorepo.repoDir, __dirname);
    const appDirInZip = path.relative(
      zipRoot,
      path.join(monorepo.repoDir, 'packages', 'app-2'),
    );
    const wrapperLinkPath = path.join(unzipDir, 'zapierwrapper.js');
    fs.lstatSync(wrapperLinkPath).isSymbolicLink().should.be.true();
    fs.readlinkSync(wrapperLinkPath).should.equal(
      path.join(appDirInZip, 'zapierwrapper.js'),
    );

    const indexLinkPath = path.join(unzipDir, 'index.js');
    fs.lstatSync(indexLinkPath).isSymbolicLink().should.be.true();
    fs.readlinkSync(indexLinkPath).should.equal(
      path.join(appDirInZip, 'index.js'),
    );

    // app-2/package.json should be copied to root directory
    const appPackageJson = fs.readJsonSync(path.join(unzipDir, 'package.json'));
    appPackageJson.name.should.equal('app-2');

    const coreDirInZip = path
      .relative(zipRoot, coreDir)
      .replace(/^[cC]:/, '')
      .replace(/^([a-zA-Z]):/, '$1');
    const corePackageJson = fs.readJsonSync(
      path.join(unzipDir, coreDirInZip, 'package.json'),
    );
    corePackageJson.version.should.equal(monorepo.corePackage.version);

    const coreLinkPath = path.join(
      unzipDir,
      appDirInZip,
      'node_modules',
      'zapier-platform-core',
    );
    fs.lstatSync(coreLinkPath).isSymbolicLink().should.be.true();
    fs.readlinkSync(coreLinkPath).should.equal(
      path.relative(path.join(appDirInZip, 'node_modules'), coreDirInZip),
    );
  });
});

describe('build in pnpm workspaces', () => {
  let monorepo, origCwd, unzipDir;

  before(async () => {
    monorepo = await setupPnpmMonorepo();
    runCommand('pnpm', ['install'], { cwd: monorepo.repoDir });

    // For context, after `pnpm install`, the directory tree looks like this:
    //
    // (project root)
    // ├── node_modules/
    // │   └── .pnpm/
    // │       ├── zapier-platform-core@<version>/
    // │       │   └── node_modules/
    // │       │       ├── zapier-platform-core/
    // │       │       │   ├── package.json
    // │       │       │   └── ...
    // │       │       ├── lodash/ -> ../../lodash@4.17.21/node_modules/lodash
    // │       │       └── other dependencies of zapier-platform-core -> ...
    // │       ├── uuid@8.3.2/
    // │       │   └── node_modules/
    // │       │       ├── uuid/
    // │       │       │   ├── package.json
    // │       │       │   └── ...
    // │       │       └── other dependencies of uuid@8.3.2 -> ...
    // │       └── uuid@9.0.1/
    // │           └── node_modules/
    // │               ├── uuid/
    // │               │   ├── package.json
    // │               │   └── ...
    // │               └── other dependencies of uuid@9.0.1 -> ...
    // ├── common/
    // │   └── hello/
    // │       ├── index.js
    // │       └── package.json
    // ├── packages/
    // │   ├── app-1/
    // │   │   ├── node_modules/
    // │   │   │   ├── zapier-platform-core -> ../../../node_modules/.pnpm/zapier-platform-core@<version>/node_modules/zapier-platform-core
    // │   │   │   ├── uuid -> ../../../node_modules/uuid@8.3.2/node_modules/uuid
    // │   │   │   └── common-hello -> ../../../common/hello
    // │   │   ├── package.json
    // │   │   ├── index.js
    // │   │   └── ...
    // │   └── app-2/
    // │       ├── node_modules/
    // │       │   ├── zapier-platform-core -> ../../../node_modules/.pnpm/zapier-platform-core@<version>/node_modules/zapier-platform-core
    // │       │   ├── uuid -> ../../../node_modules/uuid@9.0.1/node_modules/uuid
    // │       │   └── common-hello -> ../../../common/hello
    // │       ├── package.json
    // │       ├── index.js
    // │       └── ...
    // ├── package.json
    // └── pnpm-workspace.yaml
    //
    // The following test cases in this test suite bascially verify the zip file
    // has the same directory structure as the above.
  });

  after(() => {
    try {
      monorepo.cleanup();
    } catch (error) {
      if (!IS_WINDOWS) {
        // On Windows, somehow the cleanup can fail with EBUSY :shrug:
        throw error;
      }
    }
  });

  beforeEach(() => {
    origCwd = process.cwd();
    unzipDir = getNewTempDirPath();
  });

  afterEach(() => {
    process.chdir(origCwd);

    fs.removeSync(unzipDir);
    unzipDir = null;
  });

  it('should build in app-1', async () => {
    const appDir = path.join(monorepo.repoDir, 'packages', 'app-1');
    const zipPath = path.join(appDir, 'build', 'build.zip');

    // Just a quick sanity check that pnpm does what we expect it to do --
    // zapier-platform-core should be symlinked in app-1/node_modules
    const coreLinkPath = path.join(
      appDir,
      'node_modules',
      'zapier-platform-core',
    );
    fs.lstatSync(coreLinkPath).isSymbolicLink().should.be.true();

    const coreAbsPath = fs.realpathSync(coreLinkPath);
    fs.existsSync(coreAbsPath).should.be.true();

    fs.ensureDirSync(path.dirname(zipPath));
    process.chdir(appDir);

    await build.buildAndOrUpload(
      { build: true, upload: false },
      {
        skipDepInstall: true,
        skipValidation: true,
        printProgress: false,
        checkOutdated: false,
      },
    );
    await decompress(zipPath, unzipDir);

    // Root directory should have symlinks named zapierwrapper.js and index.js
    // linking to app-1/zapierwrapper.js and app-1/index.js respectively.
    const wrapperLinkPath = path.join(unzipDir, 'zapierwrapper.js');
    fs.lstatSync(wrapperLinkPath).isSymbolicLink().should.be.true();
    fs.readlinkSync(wrapperLinkPath).should.equal(
      path.join('packages', 'app-1', 'zapierwrapper.js'),
    );

    const indexLinkPath = path.join(unzipDir, 'index.js');
    fs.lstatSync(indexLinkPath).isSymbolicLink().should.be.true();
    fs.readlinkSync(indexLinkPath).should.equal(
      path.join('packages', 'app-1', 'index.js'),
    );

    // app-1/package.json should be copied to root directory
    const appPackageJson = JSON.parse(
      fs.readFileSync(path.join(unzipDir, 'package.json')),
    );
    appPackageJson.name.should.equal('app-1');

    // coreRelPath is relative to dirname(coreLinkPath)
    const coreRelPath = fs.readlinkSync(coreLinkPath);
    const match = coreRelPath.match(
      path.sep === '/'
        ? /node_modules\/\.pnpm\/(zapier-platform-core@[^/]+)\/node_modules\/zapier-platform-core$/
        : /node_modules\\\.pnpm\\(zapier-platform-core@[^\\]+)\\node_modules\\zapier-platform-core\\?$/,
    );
    should.exist(match);

    // coreDirName normally would look like "zapier-platform-core@<version>" in
    // real usage, but here it's long and ugly like
    // "zapier-platform-core@file+..+..+path+to+zapier-platform+pa_562..."
    // because we're using the local copy of the core package.
    const coreDirName = match[1];
    const pnpmNmDir = path.join(unzipDir, 'node_modules', '.pnpm');
    const corePackageJson = fs.readJsonSync(
      path.join(
        pnpmNmDir,
        coreDirName,
        'node_modules',
        'zapier-platform-core',
        'package.json',
      ),
    );
    corePackageJson.version.should.equal(monorepo.corePackage.version);

    // Make sure we only copy uuid@8.3.2, not uuid@9.0.1
    const uuidPath = path.join(pnpmNmDir, 'uuid@8.3.2', 'node_modules', 'uuid');
    const uuidPackageJson = JSON.parse(
      fs.readFileSync(path.join(uuidPath, 'package.json')),
    );
    uuidPackageJson.version.should.equal('8.3.2');
    fs.existsSync(path.join(uuidPath, 'dist', 'index.js')).should.be.true();
    fs.existsSync(path.join(pnpmNmDir, 'uuid@9.0.1')).should.be.false();

    // Make sure symlinks in app-1/node_modules are also copied to the zip
    const appNmDirInZip = path.join(
      unzipDir,
      'packages',
      'app-1',
      'node_modules',
    );
    const coreLinkPathInZip = path.join(appNmDirInZip, 'zapier-platform-core');
    fs.lstatSync(coreLinkPathInZip).isSymbolicLink().should.be.true();
    fs.readlinkSync(coreLinkPathInZip).should.equal(
      path.join(
        '..',
        '..',
        '..',
        'node_modules',
        '.pnpm',
        coreDirName,
        'node_modules',
        'zapier-platform-core',
      ),
    );

    const uuidLinkPathInZip = path.join(appNmDirInZip, 'uuid');
    fs.lstatSync(uuidLinkPathInZip).isSymbolicLink().should.be.true();
    fs.readlinkSync(uuidLinkPathInZip).should.equal(
      path.join(
        '..',
        '..',
        '..',
        'node_modules',
        '.pnpm',
        'uuid@8.3.2',
        'node_modules',
        'uuid',
      ),
    );

    // Make sure symlinks for zapier-platform-core's dependencies, like lodash,
    // are copied to the zip
    const lodashLinkPathInZip = path.join(
      pnpmNmDir,
      coreDirName,
      'node_modules',
      'lodash',
    );
    fs.lstatSync(lodashLinkPathInZip).isSymbolicLink().should.be.true();
    const lodashTargetPath = fs
      .readlinkSync(lodashLinkPathInZip)
      .replaceAll('\\', '/');
    const lodashDirName = lodashTargetPath.match(
      /\.\.\/\.\.\/(lodash@[^/]+)\/node_modules\/lodash$/,
    )[1];
    const lodashVersion = lodashDirName.split(/[@_]/)[1];
    const lodashPackageJson = fs.readJsonSync(
      path.join(
        pnpmNmDir,
        lodashDirName,
        'node_modules',
        'lodash',
        'package.json',
      ),
    );
    lodashPackageJson.version.should.equal(lodashVersion);

    // Make sure local dependency common-hello is included and symlinked
    const helloLinkPathInZip = path.join(appNmDirInZip, 'common-hello');
    fs.lstatSync(helloLinkPathInZip).isSymbolicLink().should.be.true();
    fs.readlinkSync(helloLinkPathInZip).should.equal(
      path.join('..', '..', '..', 'common', 'hello'),
    );
    const helloPackageJson = fs.readJsonSync(
      path.join(unzipDir, 'common', 'hello', 'package.json'),
    );
    helloPackageJson.name.should.equal('common-hello');
    helloPackageJson.version.should.equal('1.0.0');
    fs.existsSync(path.join(unzipDir, 'common', 'hello', 'index.js'));
  });

  it('should build in app-2', async () => {
    const appDir = path.join(monorepo.repoDir, 'packages', 'app-2');
    const zipPath = path.join(appDir, 'build', 'build.zip');

    const coreLinkPath = path.join(
      appDir,
      'node_modules',
      'zapier-platform-core',
    );
    fs.lstatSync(coreLinkPath).isSymbolicLink().should.be.true();

    // coreRelPath is relative to dirname(coreLinkPath)
    const coreRelPath = fs.readlinkSync(coreLinkPath);
    const match = coreRelPath.match(
      path.sep === '/'
        ? /node_modules\/\.pnpm\/(zapier-platform-core@[^/]+)\/node_modules\/zapier-platform-core$/
        : /node_modules\\\.pnpm\\(zapier-platform-core@[^\\]+)\\node_modules\\zapier-platform-core\\?$/,
    );
    should.exist(match);

    const coreAbsPath = path.resolve(path.dirname(coreLinkPath), coreRelPath);
    fs.existsSync(coreAbsPath).should.be.true();

    fs.ensureDirSync(path.dirname(zipPath));

    process.chdir(appDir);

    await build.buildAndOrUpload(
      { build: true, upload: false },
      {
        skipDepInstall: true,
        skipValidation: true,
        printProgress: false,
        checkOutdated: false,
      },
    );
    await decompress(zipPath, unzipDir);

    // Root directory should have symlinks named zapierwrapper.js and index.js
    // linking to app-2/zapierwrapper.js and app-2/index.js respectively.
    const wrapperLinkPath = path.join(unzipDir, 'zapierwrapper.js');
    fs.lstatSync(wrapperLinkPath).isSymbolicLink().should.be.true();
    fs.readlinkSync(wrapperLinkPath).should.equal(
      path.join('packages', 'app-2', 'zapierwrapper.js'),
    );

    const indexLinkPath = path.join(unzipDir, 'index.js');
    fs.lstatSync(indexLinkPath).isSymbolicLink().should.be.true();
    fs.readlinkSync(indexLinkPath).should.equal(
      path.join('packages', 'app-2', 'index.js'),
    );

    // app-2/package.json should be copied to root directory
    const appPackageJson = JSON.parse(
      fs.readFileSync(path.join(unzipDir, 'package.json')),
    );
    appPackageJson.name.should.equal('app-2');

    // coreDirName normally would look like "zapier-platform-core@<version>" in
    // real usage, but here it's long and ugly like
    // "zapier-platform-core@file+..+..+path+to+zapier-platform+pa_562..."
    // because we're using a local version of the core package.
    const coreDirName = match[1];
    const pnpmNmDir = path.join(unzipDir, 'node_modules', '.pnpm');
    const corePackageJson = JSON.parse(
      fs.readFileSync(
        path.join(
          pnpmNmDir,
          coreDirName,
          'node_modules',
          'zapier-platform-core',
          'package.json',
        ),
      ),
    );
    corePackageJson.version.should.equal(monorepo.corePackage.version);

    const uuidPath = path.join(pnpmNmDir, 'uuid@9.0.1', 'node_modules', 'uuid');
    const uuidPackageJson = JSON.parse(
      fs.readFileSync(path.join(uuidPath, 'package.json')),
    );
    uuidPackageJson.version.should.equal('9.0.1');
    fs.existsSync(path.join(uuidPath, 'dist', 'index.js')).should.be.true();
    fs.existsSync(path.join(pnpmNmDir, 'uuid@8.3.2')).should.be.false();

    // Make sure symlinks in app-2/node_modules are also copied to the zip
    const appNmDirInZip = path.join(
      unzipDir,
      'packages',
      'app-2',
      'node_modules',
    );
    const coreLinkPathInZip = path.join(appNmDirInZip, 'zapier-platform-core');
    fs.lstatSync(coreLinkPathInZip).isSymbolicLink().should.be.true();
    fs.readlinkSync(coreLinkPathInZip).should.equal(
      path.join(
        '..',
        '..',
        '..',
        'node_modules',
        '.pnpm',
        coreDirName,
        'node_modules',
        'zapier-platform-core',
      ),
    );

    const uuidLinkPathInZip = path.join(appNmDirInZip, 'uuid');
    fs.lstatSync(uuidLinkPathInZip).isSymbolicLink().should.be.true();
    fs.readlinkSync(uuidLinkPathInZip).should.equal(
      path.join(
        '..',
        '..',
        '..',
        'node_modules',
        '.pnpm',
        'uuid@9.0.1',
        'node_modules',
        'uuid',
      ),
    );

    // Make sure symlinks for zapier-platform-core's dependencies, like lodash,
    // are copied to the zip
    const lodashLinkPathInZip = path.join(
      pnpmNmDir,
      coreDirName,
      'node_modules',
      'lodash',
    );
    fs.lstatSync(lodashLinkPathInZip).isSymbolicLink().should.be.true();
    const lodashTargetPath = fs
      .readlinkSync(lodashLinkPathInZip)
      .replaceAll('\\', '/');
    const lodashDirName = lodashTargetPath.match(
      /\.\.\/\.\.\/(lodash@[^/]+)\/node_modules\/lodash$/,
    )[1];
    const lodashVersion = lodashDirName.split(/[@_]/)[1];
    const lodashPackageJson = fs.readJsonSync(
      path.join(
        pnpmNmDir,
        lodashDirName,
        'node_modules',
        'lodash',
        'package.json',
      ),
    );
    lodashPackageJson.version.should.equal(lodashVersion);

    // Make sure local dependency common-hello is included and symlinked
    const helloLinkPathInZip = path.join(appNmDirInZip, 'common-hello');
    fs.lstatSync(helloLinkPathInZip).isSymbolicLink().should.be.true();
    fs.readlinkSync(helloLinkPathInZip).should.equal(
      path.join('..', '..', '..', 'common', 'hello'),
    );
    const helloPackageJson = fs.readJsonSync(
      path.join(unzipDir, 'common', 'hello', 'package.json'),
    );
    helloPackageJson.name.should.equal('common-hello');
    helloPackageJson.version.should.equal('1.0.0');
    fs.existsSync(path.join(unzipDir, 'common', 'hello', 'index.js'));
  });
});

describe('build ESM (runs slowly)', function () {
  let tmpDir, entryPoint, corePackage;

  before(async () => {
    // basically does what `zapier init` does
    tmpDir = getNewTempDirPath();
    await copyDir(
      path.resolve(__dirname, '../../../../../example-apps/oauth2-typescript'),
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

    runCommand('npm', ['install', '--ignore-scripts'], { cwd: tmpDir });
    // TODO: This test depends on how "oauth2-typescript" example is set up, which
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

    const smartPaths = await build.findRequiredFiles(tmpDir, [entryPoint]);

    // check that only the required lodash files are grabbed
    smartPaths.should.containEql(path.normalize('dist/index.js'));
    smartPaths.should.containEql(path.normalize('dist/authentication.js'));

    smartPaths.filter((p) => p.endsWith('.ts')).length.should.equal(0);
    smartPaths.should.not.containEql('tsconfig.json');

    smartPaths.length.should.be.within(200, 335);
  });

  it('should list all the files', async () => {
    const dumbPaths = Array.from(build.walkDirWithPresetBlocklist(tmpDir)).map(
      (entry) => path.relative(tmpDir, path.join(entry.parentPath, entry.name)),
    );

    // check that way more than the required package files are grabbed
    dumbPaths.should.containEql(path.normalize('dist/index.js'));
    dumbPaths.should.containEql(path.normalize('dist/authentication.js'));

    dumbPaths.should.containEql(path.normalize('src/index.ts'));
    dumbPaths.should.containEql(path.normalize('src/authentication.ts'));
    dumbPaths.should.containEql('tsconfig.json');

    dumbPaths.length.should.be.within(3000, 10000);
  });

  it('list should not include blocklisted files', () => {
    const tmpProjectDir = getNewTempDirPath();

    [
      'safe.js',
      '.DS_Store',
      '.env',
      '.environment',
      `.git${path.sep}HEAD`,
      `build${path.sep}the-build.zip`,
    ].forEach((file) => {
      const fileDir = file.split(path.sep);
      fileDir.pop();
      if (fileDir.length > 0) {
        fs.ensureDirSync(path.join(tmpProjectDir, fileDir.join(path.sep)));
      }
      fs.outputFileSync(path.join(tmpProjectDir, file), 'the-file');
    });

    const dumbPaths = Array.from(
      build.walkDirWithPresetBlocklist(tmpProjectDir),
    ).map((entry) =>
      path.relative(tmpProjectDir, path.join(entry.parentPath, entry.name)),
    );
    dumbPaths.should.containEql('safe.js');
    dumbPaths.should.not.containEql('.env');
    dumbPaths.should.not.containEql(path.normalize('build/the-build.zip'));
    dumbPaths.should.not.containEql('.environment');
    dumbPaths.should.not.containEql(path.normalize('.git/HEAD'));
  });

  it('should make a build.zip', async () => {
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
    fs.outputFileSync(
      path.join(tmpProjectDir, 'package.json'),
      JSON.stringify({
        name: 'test',
        version: '1.0.0',
        main: 'index.js',
        type: 'module',
      }),
    );
    fs.ensureDirSync(path.dirname(tmpZipPath));

    global.argOpts = {};

    await build.makeBuildZip(tmpProjectDir, tmpZipPath);
    const files = await decompress(tmpZipPath, tmpUnzipPath);

    const filePaths = new Set(files.map((file) => file.path));
    filePaths.should.deepEqual(
      new Set(['index.js', 'zapierwrapper.js', 'package.json']),
    );

    const indexFile = files.find(
      ({ path: filePath }) => filePath === 'index.js',
    );
    should.exist(indexFile);
    (indexFile.mode & 0o400).should.be.above(0, 'no read permission for owner');
    (indexFile.mode & 0o040).should.be.above(0, 'no read permission for group');
    (indexFile.mode & 0o004).should.be.above(
      0,
      'no read permission for public',
    );
  });

  it('should run the zapier-build script', async () => {
    runCommand('npm', ['run', 'clean'], { cwd: tmpDir });

    await build.maybeRunBuildScript({ cwd: tmpDir });

    const buildExists = await fs.pathExists(path.join(tmpDir, 'dist'));
    should.equal(buildExists, true);
  });
});

describe('build hybrid packages in CJS app', function () {
  let tmpDir, entryPoint, corePackage;

  before(async () => {
    tmpDir = getNewTempDirPath();

    // Create a basic CJS app that uses uuid
    fs.outputFileSync(
      path.join(tmpDir, 'index.js'),
      `const { v4: uuidv4 } = require('uuid');
module.exports = {
  version: require('./package.json').version,
  triggers: {
    test: {
      operation: {
        perform: () => {
          return [{id: uuidv4()}];
        }
      }
    }
  }
};`,
    );

    // Create package.json
    corePackage = await npmPackCore();
    fs.outputFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({
        name: 'cjs-uuid-test',
        version: '1.0.0',
        main: 'index.js',
        dependencies: {
          uuid: '9.0.1',
          'zapier-platform-core': corePackage.path,
        },
      }),
    );

    runCommand('npm', ['install', '--ignore-scripts'], { cwd: tmpDir });
    entryPoint = path.resolve(tmpDir, 'index.js');
  });

  after(() => {
    fs.removeSync(tmpDir);
    corePackage.cleanup();
  });

  it('should list both CJS and ESM paths in dumbPaths', async function () {
    const dumbPaths = Array.from(
      await build.walkDirWithPresetBlocklist(tmpDir),
    ).map((entry) =>
      path.relative(tmpDir, path.join(entry.parentPath, entry.name)),
    );

    // dumbPaths should contain both CJS and ESM paths since it's just listing all files
    dumbPaths.should.containEql(
      path.normalize('node_modules/uuid/dist/index.js'),
    ); // CJS path
    dumbPaths.should.containEql(
      path.normalize('node_modules/uuid/dist/esm-node/index.js'),
    ); // ESM path
  });

  it('should only include CJS paths in smartPaths', async function () {
    const smartPaths = await build.findRequiredFiles(tmpDir, [entryPoint]);

    // For CJS app, smartPaths should only contain CJS paths
    smartPaths.should.containEql(
      path.normalize('node_modules/uuid/dist/index.js'),
    );
    smartPaths.should.not.containEql(
      path.normalize('node_modules/uuid/dist/esm-node/index.js'),
    );
  });
});

describe('build hybrid packages in ESM app', function () {
  let tmpDir, entryPoint, corePackage;

  before(async () => {
    tmpDir = getNewTempDirPath();

    // Create a basic ESM app that uses uuid
    fs.outputFileSync(
      path.join(tmpDir, 'index.js'),
      `import { v4 as uuidv4 } from 'uuid';
export default {
  version: '1.0.0',
  triggers: {
    test: {
      operation: {
        perform: () => {
          return [{id: uuidv4()}];
        }
      }
    }
  }
};`,
    );

    // Create package.json
    corePackage = await npmPackCore();
    fs.outputFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({
        name: 'esm-uuid-test',
        version: '1.0.0',
        exports: {
          import: './index.js',
        },
        type: 'module',
        dependencies: {
          uuid: '9.0.1',
          'zapier-platform-core': corePackage.path,
        },
      }),
    );

    runCommand('npm', ['install', '--ignore-scripts'], { cwd: tmpDir });
    entryPoint = path.resolve(tmpDir, 'index.js');
  });

  after(() => {
    fs.removeSync(tmpDir);
    corePackage.cleanup();
  });

  it('should list both CJS and ESM paths in dumbPaths', async function () {
    const dumbPaths = Array.from(
      await build.walkDirWithPresetBlocklist(tmpDir),
    ).map((entry) =>
      path.relative(tmpDir, path.join(entry.parentPath, entry.name)),
    );

    // dumbPaths should contain both CJS and ESM paths since it's just listing all files
    dumbPaths.should.containEql(
      path.normalize('node_modules/uuid/dist/index.js'),
    ); // CJS path
    dumbPaths.should.containEql(
      path.normalize('node_modules/uuid/dist/esm-node/index.js'),
    ); // ESM path
    dumbPaths.should.containEql(
      path.normalize('node_modules/uuid/wrapper.mjs'),
    ); // ESM path
  });

  it('should only include ESM paths in smartPaths', async function () {
    const smartPaths = await build.findRequiredFiles(tmpDir, [entryPoint]);

    // For ESM app, smartPaths should contain the "exports/./node/import" entry
    // point: './wrapper.mjs' (https://github.com/uuidjs/uuid/blob/v9.0.1/package.json#L30)
    smartPaths.should.containEql(
      path.normalize('node_modules/uuid/wrapper.mjs'),
    );
    smartPaths.should.containEql(
      path.normalize('node_modules/uuid/dist/index.js'),
    );

    // This one, even though it's a ESM entry point, defined in
    // "exports/./node/module", it isn't used by Node.js
    smartPaths.should.not.containEql(
      path.normalize('node_modules/uuid/dist/esm-node/index.js'),
    );
  });
});

describe('build legacy scripting dependencies', function () {
  let tmpDir, entryPoint, corePackage;

  before(async () => {
    tmpDir = getNewTempDirPath();

    // Create a basic app that uses legacy-scripting-runner
    fs.outputFileSync(
      path.join(tmpDir, 'index.js'),
      `const { run } = require('zapier-platform-legacy-scripting-runner');
run();`,
    );

    // Create package.json
    corePackage = await npmPackCore();
    fs.outputFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({
        name: 'legacy-scripting-test',
        version: '1.0.0',
        main: 'index.js',
        dependencies: {
          'zapier-platform-core': corePackage.path,
          'zapier-platform-legacy-scripting-runner': 'latest',
        },
      }),
    );

    runCommand('npm', ['install', '--ignore-scripts'], { cwd: tmpDir });
    entryPoint = path.resolve(tmpDir, 'index.js');
  });

  after(() => {
    fs.removeSync(tmpDir);
    corePackage.cleanup();
  });

  it('should include certain legacy paths in smartPaths', async function () {
    const smartPaths = await build.findRequiredFiles(tmpDir, [entryPoint]);

    smartPaths.should.containEql(
      path.normalize(
        'node_modules/zapier-platform-legacy-scripting-runner/request-worker.js',
      ),
    );
  });
});

describe('build with specific dependency', function () {
  let appDir, corePackage, unzipDir, zipPath, origCwd;

  before(async () => {
    corePackage = await npmPackCore();
  });

  after(() => {
    corePackage.cleanup();
  });

  beforeEach(() => {
    appDir = getNewTempDirPath();
    zipPath = path.join(appDir, 'build', 'build.zip');
    unzipDir = getNewTempDirPath();

    fs.ensureDirSync(appDir);
    fs.ensureDirSync(unzipDir);

    origCwd = process.cwd();
    process.chdir(appDir);
  });

  afterEach(() => {
    process.chdir(origCwd);

    fs.removeSync(appDir);
    fs.removeSync(unzipDir);

    appDir = null;
    zipPath = null;
    unzipDir = null;
  });

  it('should build with ssh2 with .node files', async function () {
    if (process.platform === 'win32') {
      // On Windows, ssh2 package doesn't seem to need those .node files
      this.skip('test');
      return;
    }
    // Create a basic app that uses ssh2
    fs.outputFileSync(
      path.join(appDir, 'app.js'),
      `import { Client } from 'ssh2';
import zapier from 'zapier-platform-core';
import packageJson from './package.json' with { type: 'json' };
function getClient() { return new Client(); }
export default {
  version: packageJson.version,
  platformversion: zapier.version,
};
`,
    );

    // Create package.json
    corePackage = await npmPackCore();
    fs.outputFileSync(
      path.join(appDir, 'package.json'),
      JSON.stringify({
        name: 'test-app',
        version: '1.0.0',
        exports: './app.js',
        type: 'module',
        dependencies: {
          'zapier-platform-core': corePackage.path,
          ssh2: '1.16.0',
        },
      }),
    );

    // ssh2 requires building native code, so we install it first with
    // --ignore-scripts disabled.
    runCommand('npm', ['install', '--ignore-scripts', 'false', 'ssh2@1.16.0'], {
      cwd: appDir,
    });
    runCommand('npm', ['install', '--ignore-scripts'], { cwd: appDir });

    await build.buildAndOrUpload(
      { build: true, upload: false },
      {
        cwd: appDir,
        skipDepInstall: true,
        skipValidation: true,
        printProgress: false,
        checkOutdated: false,
      },
    );
    await decompress(zipPath, unzipDir);

    const expectedFiles = [
      'app.js',
      'package.json',
      'zapierwrapper.js',
      'definition.json',
      path.normalize('node_modules/ssh2/package.json'),
      path.normalize('node_modules/ssh2/lib/protocol/crypto.js'),
      path.normalize(
        'node_modules/ssh2/lib/protocol/crypto/build/Release/sshcrypto.node',
      ),
      path.normalize('node_modules/cpu-features/package.json'),
      path.normalize('node_modules/cpu-features/lib/index.js'),
      path.normalize(
        'node_modules/cpu-features/build/Release/cpufeatures.node',
      ),
    ];
    for (const file of expectedFiles) {
      fs.existsSync(path.join(unzipDir, file)).should.be.true(
        `Missing file in zip: ${file}`,
      );
    }
  });
});
