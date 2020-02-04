// Any important changes here need to be made to src/smoke-tests/ in the cli repo!

const { spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

require('should');
const fetch = require('node-fetch');

const TEST_APPS = [
  'basic-auth',
  'create',
  // 'custom-auth',
  // 'oauth2',
  // 'resource',
  // 'search',
  // 'session-auth',
  'trigger'
];

const REGEX_VERSION = /\d+\.\d+\.\d+/;

const setupZapierRC = () => {
  let hasRC = false;
  const rcPath = path.join(os.homedir(), '.zapierrc');
  if (fs.existsSync(rcPath)) {
    hasRC = true;
  } else if (process.env.DEPLOY_KEY) {
    fs.writeFileSync(
      rcPath,
      JSON.stringify({ deployKey: process.env.DEPLOY_KEY })
    );
    hasRC = true;
  }

  return hasRC;
};

const setupZapierAppRC = workdir => {
  let hasAppRC = false;
  if (process.env.TEST_APP_ID && process.env.TEST_APP_KEY) {
    const rcPath = path.join(workdir, '.zapierapprc');
    if (!fs.existsSync(rcPath)) {
      fs.writeFileSync(
        rcPath,
        JSON.stringify({
          id: parseInt(process.env.TEST_APP_ID),
          key: process.env.TEST_APP_KEY
        })
      );
      hasAppRC = true;
    }
  }
  return hasAppRC;
};

const npmPack = () => {
  let filename;
  const proc = spawnSync('npm', ['pack'], { encoding: 'utf8' });
  const lines = proc.stdout.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line) {
      filename = line;
      break;
    }
  }
  return filename;
};

const setupTempWorkingDir = () => {
  let workdir;
  const tmpBaseDir = os.tmpdir();
  while (!workdir || fs.existsSync(workdir)) {
    workdir = path.join(
      tmpBaseDir,
      'zapier-' + crypto.randomBytes(20).toString('hex')
    );
  }
  fs.mkdirSync(workdir);
  return workdir;
};

const copyTestApps = workdir => {
  const repoRoot = path.dirname(path.dirname(path.dirname(__dirname)));
  TEST_APPS.forEach(appName => {
    const srcAppDir = path.join(repoRoot, 'example-apps', appName);
    const destAppDir = path.join(workdir, appName);
    fs.copySync(srcAppDir, destAppDir);
  });
};

const npmInstalls = (packagePath, workdir) => {
  spawnSync('npm', ['install'], {
    encoding: 'utf8',
    cwd: workdir
  });
  spawnSync('npm', ['install', 'zapier-platform-cli'], {
    encoding: 'utf8',
    cwd: workdir
  });
  spawnSync('npm', ['install', '--no-save', packagePath], {
    encoding: 'utf8',
    cwd: workdir
  });
};

describe('smoke tests - setup will take some time', () => {
  const context = {
    // Global context that will be available for all test cases in this test suite
    package: {
      filename: null,
      version: null,
      path: null
    },
    workRepoDir: null,
    workAppDir: null,
    cliBin: null,
    hasRC: false,
    hasAppRC: false
  };

  before(async () => {
    context.hasRC = setupZapierRC();

    context.package.filename = npmPack();
    context.package.version = context.package.filename.match(REGEX_VERSION)[0];
    context.package.path = path.join(process.cwd(), context.package.filename);

    context.workRepoDir = setupTempWorkingDir();

    copyTestApps(context.workRepoDir);
  });

  after(() => {
    fs.unlinkSync(context.package.path);
    fs.removeSync(context.workRepoDir);
  });

  it('package size should not change much', async () => {
    const baseUrl = 'https://registry.npmjs.org/zapier-platform-core';
    let res = await fetch(baseUrl);
    const packageInfo = await res.json();
    const latestVersion = packageInfo['dist-tags'].latest;

    res = await fetch(
      `${baseUrl}/-/zapier-platform-core-${latestVersion}.tgz`,
      {
        method: 'HEAD'
      }
    );
    const baselineSize = res.headers.get('content-length');
    const newSize = fs.statSync(context.package.path).size;
    newSize.should.be.within(baselineSize * 0.7, baselineSize * 1.3);
  });

  TEST_APPS.forEach(appName => {
    describe(appName, () => {
      before(async () => {
        context.workAppDir = path.join(context.workRepoDir, appName);
        npmInstalls(context.package.path, context.workAppDir);

        context.hasAppRC = setupZapierAppRC(context.workAppDir);

        context.cliBin = path.join(
          context.workAppDir,
          'node_modules',
          '.bin',
          'zapier'
        );
      });

      it('zapier test', () => {
        const proc = spawnSync(context.cliBin, ['test'], {
          encoding: 'utf8',
          cwd: context.workAppDir,
          env: {
            PATH: process.env.PATH,
            DISABLE_ZAPIER_ANALYTICS: 1
          }
        });
        if (proc.status !== 0) {
          console.log(proc.stdout);
          console.log(proc.stderr);
        }
        proc.status.should.eql(0);
      });

      it('zapier build', function() {
        if (!context.hasAppRC) {
          this.skip();
          return;
        }

        const proc = spawnSync(context.cliBin, ['build'], {
          encoding: 'utf8',
          cwd: context.workAppDir,
          env: {
            SKIP_NPM_INSTALL: '1',
            PATH: process.env.PATH,
            DISABLE_ZAPIER_ANALYTICS: 1
          }
        });
        if (proc.status !== 0) {
          console.log(proc.stdout);
          console.log(proc.stderr);
        }
        proc.status.should.eql(0);
      });
    });
  });
});
