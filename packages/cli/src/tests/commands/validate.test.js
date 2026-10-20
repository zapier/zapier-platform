const crypto = require('crypto');
const os = require('os');
const path = require('path');

const fs = require('fs-extra');
const nock = require('nock');
const should = require('should');
const { captureOutput } = require('@oclif/test');

const { BASE_ENDPOINT } = require('../../constants');
const { checkResult } = require('../fixtures/checkResult');
const ValidateCommand = require('../../oclif/commands/validate');

const CORE_DIR = path.resolve(__dirname, '../../../../core');
const CORE_VERSION = require(path.join(CORE_DIR, 'package.json')).version;

const setupTempAppDir = () => {
  const appDir = path.join(os.tmpdir(), crypto.randomBytes(20).toString('hex'));
  fs.mkdirSync(appDir);
  fs.writeJsonSync(path.join(appDir, 'package.json'), {
    name: 'validate-test-app',
    version: '1.0.0',
    main: 'index.js',
    dependencies: { 'zapier-platform-core': CORE_VERSION },
  });
  fs.writeFileSync(
    path.join(appDir, 'index.js'),
    `module.exports = { version: '1.0.0', platformVersion: '${CORE_VERSION}' };\n`,
  );
  fs.ensureDirSync(path.join(appDir, 'node_modules'));
  fs.symlinkSync(
    CORE_DIR,
    path.join(appDir, 'node_modules', 'zapier-platform-core'),
    'dir',
  );
  return appDir;
};

describe('ValidateCommand', () => {
  let appDir, origCwd, origDeployKey;

  beforeEach(() => {
    origCwd = process.cwd();
    origDeployKey = process.env.ZAPIER_DEPLOY_KEY;
    delete process.env.ZAPIER_DEPLOY_KEY;
    appDir = setupTempAppDir();
    process.chdir(appDir);
    process.exitCode = undefined;
  });

  afterEach(() => {
    process.chdir(origCwd);
    fs.removeSync(appDir);
    if (origDeployKey === undefined) {
      delete process.env.ZAPIER_DEPLOY_KEY;
    } else {
      process.env.ZAPIER_DEPLOY_KEY = origDeployKey;
    }
    process.exitCode = undefined;
    nock.cleanAll();
  });

  const mockCheck = (counts) =>
    nock(BASE_ENDPOINT)
      .post('/api/platform/cli/check')
      .reply(200, checkResult(counts));

  describe('--fail-for-publishing', () => {
    it('exits non-zero when there are publishing tasks', async () => {
      mockCheck({ warnings: 2 });

      const { stdout } = await captureOutput(async () =>
        ValidateCommand.run(['--fail-for-publishing']),
      );

      should(process.exitCode).eql(1);
      should(stdout).containEql('unresolved publishing tasks');
    });

    it('exits zero when there are no publishing tasks', async () => {
      mockCheck({ suggestions: 3 });

      await captureOutput(async () =>
        ValidateCommand.run(['--fail-for-publishing']),
      );

      should(process.exitCode).be.undefined();
    });

    it('leaves the exit code alone when the flag is absent', async () => {
      mockCheck({ warnings: 2 });

      const { stdout } = await captureOutput(async () =>
        ValidateCommand.run([]),
      );

      should(process.exitCode).be.undefined();
      should(stdout).not.containEql('unresolved publishing tasks');
    });
  });
});
