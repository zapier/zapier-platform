const fs = require('fs-extra');
const os = require('os');
const path = require('path');

require('should');

const { getPackageLatestVersion, getPackageSize } = require('../utils/npm');
const { makeTempDir } = require('../utils/files');
const { runCommand } = require('../tests/_helpers');
const { PLATFORM_PACKAGE } = require('../constants');

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

const npmPack = () => {
  let filename;
  const lines = runCommand('npm', ['pack']).split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line) {
      filename = line;
      break;
    }
  }
  return filename;
};

const npmInstall = (packagePath, workdir) => {
  runCommand('npm', ['install', '--production', packagePath], {
    cwd: workdir
  });
};

describe('smoke tests - setup will take some time', () => {
  const context = {
    // Global context that will be available for all test cases in this test suite
    package: {
      filename: null,
      version: null,
      path: null,
      corePath: null
    },
    workdir: null,
    cliBin: null,
    hasRC: false
  };

  before(() => {
    context.hasRC = setupZapierRC();

    context.package.filename = npmPack();
    context.package.version = context.package.filename.match(REGEX_VERSION)[0];
    context.package.path = path.join(process.cwd(), context.package.filename);
    context.package.corePath = path.join(process.cwd(), '..', 'core');

    context.workdir = makeTempDir();

    npmInstall(context.package.path, context.workdir);

    context.cliBin = path.join(
      context.workdir,
      'node_modules',
      '.bin',
      'zapier'
    );
  });

  after(() => {
    fs.unlinkSync(context.package.path);
    fs.removeSync(context.workdir);
  });

  it('package size should not change much', async function() {
    const packageName = 'zapier-platform-cli';
    const latestVersion = await getPackageLatestVersion(packageName);
    const baselineSize = await getPackageSize(packageName, latestVersion);
    const newSize = fs.statSync(context.package.path).size;
    newSize.should.be.within(baselineSize * 0.7, baselineSize * 1.3);

    this.test.title += ` (${baselineSize} -> ${newSize} bytes)`;
  });

  it('cli executable should exist', () => {
    fs.existsSync(context.cliBin).should.be.true();
  });

  it('zapier --version', () => {
    const firstLine = runCommand(context.cliBin, ['--version']);
    firstLine
      .includes(`zapier-platform-cli/${context.package.version}`)
      .should.be.true();
  });

  it('zapier init', () => {
    runCommand(context.cliBin, ['init', 'awesome-app'], {
      cwd: context.workdir
    });

    const newAppDir = path.join(context.workdir, 'awesome-app');
    fs.existsSync(newAppDir).should.be.true();

    const appIndexJs = path.join(newAppDir, 'index.js');
    const appPackageJson = path.join(newAppDir, 'package.json');
    fs.existsSync(appIndexJs).should.be.true();
    fs.existsSync(appPackageJson).should.be.true();
  });

  it('zapier init --template=babel', () => {
    runCommand(context.cliBin, ['init', 'babel-app', '--template=babel'], {
      cwd: context.workdir
    });

    const newAppDir = path.join(context.workdir, 'babel-app');
    fs.existsSync(newAppDir).should.be.true();

    const appIndexJs = path.join(newAppDir, 'index.js');
    const appPackageJson = path.join(newAppDir, 'package.json');
    fs.existsSync(appIndexJs).should.be.true();
    fs.existsSync(appPackageJson).should.be.true();

    const pkg = JSON.parse(
      fs.readFileSync(appPackageJson, { encoding: 'utf8' })
    );
    pkg.name.should.containEql('babel');
  });

  it('zapier scaffold trigger neat', () => {
    runCommand(context.cliBin, ['init', 'scaffold-town'], {
      cwd: context.workdir
    });

    const newAppDir = path.join(context.workdir, 'scaffold-town');
    fs.existsSync(newAppDir).should.be.true();

    // npm install was already run, so it'll run the validaion function
    runCommand(context.cliBin, ['scaffold', 'trigger', 'neat'], {
      cwd: newAppDir
    });

    const appIndexJs = path.join(newAppDir, 'index.js');
    const appPackageJson = path.join(newAppDir, 'package.json');
    fs.existsSync(appIndexJs).should.be.true();
    fs.existsSync(appPackageJson).should.be.true();

    const newTrigger = path.join(newAppDir, 'triggers', 'neat.js');
    fs.existsSync(newTrigger).should.be.true();

    const newTriggerTest = path.join(newAppDir, 'test', 'triggers', 'neat.js');
    fs.existsSync(newTriggerTest).should.be.true();

    const pkg = JSON.parse(
      fs.readFileSync(appPackageJson, { encoding: 'utf8' })
    );
    pkg.name.should.containEql('minimal');
  });

  it('zapier integrations', function() {
    if (!context.hasRC) {
      this.skip();
    }
    const stdout = runCommand(context.cliBin, [
      'integrations',
      '--format=json'
    ]);
    const result = JSON.parse(stdout);
    result.should.be.Array();
  });

  describe('init w/ auth (runs very slowly)', () => {
    const testableAuthTypes = [
      'basic-auth',
      'custom-auth',
      'digest-auth',
      // 'oauth1-trello',
      'oauth2',
      'session-auth'
    ];

    const subfolder = 'auth-tests';
    let subfolderPath;
    before(() => {
      subfolderPath = path.join(context.workdir, subfolder);
      runCommand(context.cliBin, ['yo', subfolder, '-t', 'minimal'], {
        cwd: context.workdir
      });

      // use the local copy of core, not the published one
      const packageJsonPath = path.join(subfolderPath, 'package.json');
      const origPackageJsonText = fs.readFileSync(packageJsonPath);
      const packageJson = JSON.parse(origPackageJsonText);
      packageJson.dependencies[
        PLATFORM_PACKAGE
      ] = `file:${context.package.corePath}`;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));

      runCommand('yarn', {
        cwd: subfolderPath
      });
      runCommand('yarn', ['add', context.package.corePath], {
        cwd: subfolderPath
      });

      fs.writeFileSync(packageJsonPath, origPackageJsonText);
    });

    testableAuthTypes.forEach(authType => {
      it(`${authType} should test out of the box`, () => {
        runCommand(context.cliBin, ['yo', subfolder, '-t', authType], {
          cwd: context.workdir,
          input: 'a' // tells `yo` to replace the auth file
        });

        // should not throw an error
        runCommand(context.cliBin, ['test', '--skip-validate'], {
          cwd: subfolderPath
        });
      });
    });
  });
});
