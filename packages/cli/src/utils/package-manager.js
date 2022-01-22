const { pathExists } = require('fs-extra');
const path = require('path');

const packageManagers = [
  {
    lockFile: 'package-lock.json',
    forceFlag: undefined,
    executable: 'npm',
    useDoubleHyphenBeforeArgs: true,
  },
  {
    lockFile: 'yarn.lock',
    forceFlag: 'yarn',
    executable: 'yarn',
    useDoubleHyphenBeforeArgs: false, // yarn gives a warning if we include `--`
  },
  {
    lockFile: 'pnpm-lock.yaml',
    forceFlag: 'pnpm',
    executable: 'pnpm',
    useDoubleHyphenBeforeArgs: true,
  },
];

const defaultPackageManager = packageManagers[0];

const getPackageManager = async (flags) => {
  for (const man of packageManagers) {
    if (flags[man.forceFlag]) {
      return man;
    }
  }

  for (const man of packageManagers) {
    if (await pathExists(path.join(process.cwd(), man.lockFile))) {
      return man;
    }
  }

  return defaultPackageManager;
};

module.exports = {
  getPackageManager,
};
