const { spawnSync } = require('child_process');

const runCommand = (cmd, args, opts = {}) => {
  const { stdout, stderr, status } = spawnSync(cmd, args, {
    encoding: 'utf8',
    ...opts
  });
  if (status) {
    throw new Error(stderr || stdout);
  }
  return stdout;
};

module.exports = { runCommand };
