const { spawnSync } = require('child_process');
const { realpathSync } = require('fs');
const { tmpdir } = require('os');
const { join } = require('path');
const { randomBytes } = require('crypto');

const runCommand = (cmd, args, opts = {}) => {
  const { stdout, stderr, status } = spawnSync(cmd, args, {
    encoding: 'utf8',
    ...opts,
  });
  if (status) {
    throw new Error(stderr || stdout);
  }
  return stdout;
};

const randomStr = (length = 4) => randomBytes(length).toString('hex');

const getNewTempDirPath = () =>
  join(realpathSync(tmpdir()), `zapier-${randomStr()}`);

module.exports = { runCommand, getNewTempDirPath, randomStr };
