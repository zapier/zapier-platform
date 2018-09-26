// Any important changes here need to be made to src/smoke-tests/ in the cli repo!

const { spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

require('should');
const AdmZip = require('adm-zip');
const fetch = require('node-fetch');

const TEST_REPOS = [
  'zapier-platform-example-app-basic-auth',
  'zapier-platform-example-app-create',
  // 'zapier-platform-example-app-custom-auth',
  // 'zapier-platform-example-app-oauth2',
  // 'zapier-platform-example-app-resource',
  // 'zapier-platform-example-app-search',
  // 'zapier-platform-example-app-session-auth',
  'zapier-platform-example-app-trigger'
];

const REGEX_VERSION = /\d+\.\d+\.\d+/;

const setupZapierRC = () => {
  let hasRC = false;
  if (process.env.DEPLOY_KEY) {
    const rcPath = path.join(os.homedir(), '.zapierrc');
    if (!fs.existsSync(rcPath)) {
      fs.writeFileSync(
        rcPath,
        JSON.stringify({ deployKey: process.env.DEPLOY_KEY })
      );
      hasRC = true;
    }
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
    workdir = path.join(tmpBaseDir, crypto.randomBytes(20).toString('hex'));
  }
  fs.mkdirSync(workdir);
  return workdir;
};

const downloadRepoZip = async (repoName, workdir) => {
  const zipUrl = `https://github.com/zapier/${repoName}/archive/master.zip`;
  const res = await fetch(zipUrl);

  const zipPath = path.join(workdir, 'repo.zip');
  const dest = fs.createWriteStream(zipPath);

  return await new Promise((resolve, reject) => {
    res.body.pipe(dest);
    res.body.on('error', err => {
      reject(err);
    });
    dest.on('finish', () => {
      resolve(zipPath);
    });
    dest.on('error', err => {
      reject(err);
    });
  });
};

const extractRepoZip = (zipPath, workdir) => {
  const zip = new AdmZip(zipPath);

  // Want to skip the top directory in the repo zip
  zip.getEntries().forEach(entry => {
    // We don't care if this would ever work on Windows
    const entryPath = entry.entryName
      .split('/')
      .slice(1)
      .join('/');
    if (entryPath) {
      const destDir = path.join(workdir, path.dirname(entryPath));
      zip.extractEntryTo(entry, destDir, false);
    }
  });

  fs.unlinkSync(zipPath);
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
    workdir: null,
    cliBin: null,
    hasRC: false,
    hasAppRC: false
  };

  before(() => {
    context.hasRC = setupZapierRC();

    context.package.filename = npmPack();
    context.package.version = context.package.filename.match(REGEX_VERSION)[0];
    context.package.path = path.join(process.cwd(), context.package.filename);
  });

  after(() => {
    fs.unlinkSync(context.package.path);
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

  TEST_REPOS.forEach(repoName => {
    describe(repoName, () => {
      before(async () => {
        context.workdir = setupTempWorkingDir();

        const repoZipPath = await downloadRepoZip(repoName, context.workdir);
        extractRepoZip(repoZipPath, context.workdir);

        npmInstalls(context.package.path, context.workdir);

        context.hasAppRC = setupZapierAppRC(context.workdir);

        context.cliBin = path.join(
          context.workdir,
          'node_modules',
          '.bin',
          'zapier'
        );

        setupZapierAppRC(context.workdir);
      });

      after(() => {
        fs.removeSync(context.workdir);
      });

      it('zapier test', () => {
        const proc = spawnSync(context.cliBin, ['test'], {
          encoding: 'utf8',
          cwd: context.workdir
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
          cwd: context.workdir,
          env: {
            SKIP_NPM_INSTALL: '1',
            PATH: process.env.PATH
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
