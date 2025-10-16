const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const should = require('should');
const { captureOutput } = require('@oclif/test');

const PushCommand = require('../../oclif/commands/push');

const setupTempWorkingDir = () => {
  let workdir;
  const tmpBaseDir = os.tmpdir();
  while (!workdir || fs.existsSync(workdir)) {
    workdir = path.join(tmpBaseDir, crypto.randomBytes(20).toString('hex'));
  }
  fs.mkdirSync(workdir);
  return workdir;
};

describe('PushCommand', () => {
  let tempAppDir;

  beforeEach(() => {
    tempAppDir = setupTempWorkingDir();
  });

  afterEach(() => {
    fs.removeSync(tempAppDir);
  });

  describe('snapshot label validation', () => {
    it('should reject snapshot labels longer than 12 characters', async () => {
      const { error } = await captureOutput(async () => {
        await PushCommand.run(['--snapshot', 'this-is-13-ch']);
      });

      should(error).be.ok();
      should(error.message).containEql(
        'Snapshot label cannot exceed 12 characters',
      );
    });

    it('should accept snapshot labels with exactly 12 characters', async () => {
      const { error } = await captureOutput(async () => {
        await PushCommand.run(['--snapshot', '123456789012']);
      });

      // Should not error about snapshot label length
      // (may error for other reasons like missing dependencies, but that's expected)
      if (error) {
        should(error.message).not.containEql(
          'Snapshot label cannot exceed 12 characters',
        );
      }
    });

    it('should accept snapshot labels shorter than 12 characters', async () => {
      const { error } = await captureOutput(async () => {
        await PushCommand.run(['--snapshot', 'short']);
      });

      // Should not error about snapshot label length
      // (may error for other reasons like missing dependencies, but that's expected)
      if (error) {
        should(error.message).not.containEql(
          'Snapshot label cannot exceed 12 characters',
        );
      }
    });
  });
});
