// Any important changes here need to be made to src/smoke-tests/ in the cli repo!

const { spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

require('should');
const fetch = require('node-fetch');

const CORE_PACKAGE_NAME = 'zapier-platform-core';

const TEST_APPS = [
  'basic-auth',
  'create',
  // 'custom-auth',
  // 'oauth2',
  // 'resource',
  // 'search',
  // 'session-auth',
  'trigger',
];

const setupZapierRC = () => {
  let hasRC = false;
  const rcPath = path.join(os.homedir(), '.zapierrc');
  if (fs.existsSync(rcPath)) {
    hasRC = true;
  } else if (process.env.DEPLOY_KEY) {
    fs.writeFileSync(
      rcPath,
      JSON.stringify({ deployKey: process.env.DEPLOY_KEY }),
    );
    hasRC = true;
  }

  return hasRC;
};

const setupZapierAppRC = (workdir) => {
  let hasAppRC = false;
  if (process.env.TEST_APP_ID && process.env.TEST_APP_KEY) {
    const rcPath = path.join(workdir, '.zapierapprc');
    if (!fs.existsSync(rcPath)) {
      fs.writeFileSync(
        rcPath,
        JSON.stringify({
          id: parseInt(process.env.TEST_APP_ID),
          key: process.env.TEST_APP_KEY,
        }),
      );
      hasAppRC = true;
    }
  }
  return hasAppRC;
};

const getPackageDir = (dirname) =>
  path.resolve(path.dirname(process.cwd()), dirname);

const npmPack = (workingDir) => {
  const proc = spawnSync('npm', ['pack'], {
    encoding: 'utf8',
    cwd: workingDir,
  });
  const lines = proc.stdout.split('\n');
  let filename;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line) {
      filename = line;
      break;
    }
  }
  return filename;
};

const npmPackCore = (schemaPackagePath) => {
  // Patch core's package.json to use schema from local
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const originalPackageJsonText = fs.readFileSync(packageJsonPath, {
    encoding: 'utf8',
  });
  const packageJson = JSON.parse(originalPackageJsonText);
  packageJson.dependencies['zapier-platform-schema'] =
    `file:${schemaPackagePath}`;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));

  let filename;

  try {
    const proc = spawnSync('npm', ['pack'], { encoding: 'utf8' });
    const lines = proc.stdout.split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line) {
        filename = line;
        break;
      }
    }
  } finally {
    fs.writeFile(packageJsonPath, originalPackageJsonText);
  }

  return filename;
};

const setupTempWorkingDir = () => {
  let workdir;
  const tmpBaseDir = os.tmpdir();
  while (!workdir || fs.existsSync(workdir)) {
    workdir = path.join(
      tmpBaseDir,
      'zapier-' + crypto.randomBytes(20).toString('hex'),
    );
  }
  fs.mkdirSync(workdir);
  return workdir;
};

const copyTestApps = (workdir) => {
  const repoRoot = path.dirname(path.dirname(path.dirname(__dirname)));
  TEST_APPS.forEach((appName) => {
    const srcAppDir = path.join(repoRoot, 'example-apps', appName);
    const destAppDir = path.join(workdir, appName);
    fs.copySync(srcAppDir, destAppDir, {
      filter: (src, dest) => !src.includes('node_modules/'),
    });
  });
};

const npmInstalls = (coreZipPath, cliZipPath, workdir) => {
  // When releasing a new core version, example apps would have bumped their
  // core before the new core version is published to npm. So we need to patch
  // example app's package.json to use local core temporarily to avoid `npm
  // install` error.
  const packageJsonPath = path.join(workdir, 'package.json');
  const origPackageJsonText = fs.readFileSync(packageJsonPath);
  const packageJson = JSON.parse(origPackageJsonText);
  packageJson.dependencies[CORE_PACKAGE_NAME] = `file:${coreZipPath}`;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));

  try {
    spawnSync('npm', ['install'], {
      encoding: 'utf8',
      cwd: workdir,
    });
    spawnSync('npm', ['install', '--no-save', cliZipPath], {
      encoding: 'utf8',
      cwd: workdir,
    });
  } finally {
    fs.writeFileSync(packageJsonPath, origPackageJsonText);
  }
};

describe('smoke tests - setup will take some time', () => {
  const context = {
    // Global context that will be available for all test cases in this test suite
    corePackage: {
      filename: null,
      path: null,
    },
    schemaPackage: {
      filename: null,
      path: null,
    },
    cliPackage: {
      filename: null,
      path: null,
    },
    workRepoDir: null,
    workAppDir: null,
    cliBin: null,
    hasRC: false,
    hasAppRC: false,
  };

  before(async () => {
    context.hasRC = setupZapierRC();

    const cliDir = getPackageDir('cli');
    context.cliPackage.filename = npmPack(cliDir);
    context.cliPackage.path = path.join(cliDir, context.cliPackage.filename);

    const schemaDir = getPackageDir('schema');
    context.schemaPackage.filename = npmPack(schemaDir);
    context.schemaPackage.path = path.join(
      schemaDir,
      context.schemaPackage.filename,
    );

    context.corePackage.filename = npmPackCore(context.schemaPackage.path);
    context.corePackage.path = path.join(
      process.cwd(),
      context.corePackage.filename,
    );

    context.workRepoDir = setupTempWorkingDir();

    copyTestApps(context.workRepoDir);
  });

  after(() => {
    fs.unlinkSync(context.cliPackage.path);
    fs.unlinkSync(context.corePackage.path);
    fs.unlinkSync(context.schemaPackage.path);
    fs.removeSync(context.workRepoDir);
  });

  it('package size should not change much', async function () {
    const baseUrl = 'https://registry.npmjs.org/zapier-platform-core';
    let res = await fetch(baseUrl);
    const packageInfo = await res.json();
    const latestVersion = packageInfo['dist-tags'].latest;

    res = await fetch(`${baseUrl}/-/zapier-platform-core-${latestVersion}.tgz`);
    const baselineSize = res.headers.get('content-length');
    const newSize = fs.statSync(context.corePackage.path).size;
    newSize.should.be.within(baselineSize * 0.7, baselineSize * 1.3);

    this.test.title += ` (${baselineSize} -> ${newSize} bytes)`;
  });

  TEST_APPS.forEach((appName) => {
    describe(appName, () => {
      before(async () => {
        context.workAppDir = path.join(context.workRepoDir, appName);
        npmInstalls(
          context.corePackage.path,
          context.cliPackage.path,
          context.workAppDir,
        );

        context.hasAppRC = setupZapierAppRC(context.workAppDir);

        context.cliBin = path.join(
          context.workAppDir,
          'node_modules',
          '.bin',
          'zapier',
        );
      });

      it('zapier test', () => {
        const proc = spawnSync(context.cliBin, ['test'], {
          encoding: 'utf8',
          cwd: context.workAppDir,
          env: {
            PATH: process.env.PATH,
            DISABLE_ZAPIER_ANALYTICS: 1,
          },
        });
        if (proc.status !== 0) {
          console.log(proc.stdout);
          console.log(proc.stderr);
        }
        proc.status.should.eql(0);
      });

      it('zapier build', function () {
        if (!context.hasAppRC) {
          this.skip();
          return;
        }

        const proc = spawnSync(
          context.cliBin,
          ['build', '--skip-npm-install'],
          {
            encoding: 'utf8',
            cwd: context.workAppDir,
            env: {
              PATH: process.env.PATH,
              DISABLE_ZAPIER_ANALYTICS: 1,
            },
          },
        );
        if (proc.status !== 0) {
          console.log(proc.stdout);
          console.log(proc.stderr);
        }
        proc.status.should.eql(0);
      });
    });
  });
});
