const { pathExists, readFile } = require('fs-extra');
const path = require('path');

const packageManagers = {
  npm: {
    lockFile: 'package-lock.json',
    forceFlag: undefined,
    executable: 'npm',
    useDoubleHyphenBeforeArgs: true,
  },
  yarn: {
    lockFile: 'yarn.lock',
    forceFlag: 'yarn',
    executable: 'yarn',
    useDoubleHyphenBeforeArgs: false, // yarn gives a warning if we include `--`
  },
  pnpm: {
    lockFile: 'pnpm-lock.yaml',
    forceFlag: 'pnpm',
    executable: 'pnpm',
    useDoubleHyphenBeforeArgs: true,
  },
  bun: {
    lockFile: 'bun.lock',
    forceFlag: 'bun',
    executable: 'bun',
    useDoubleHyphenBeforeArgs: false,
  },
};

const defaultPackageManager = packageManagers.npm;

const getPackageManager = async (flags = {}) => {
  for (const config of Object.values(packageManagers)) {
    if (config.forceFlag && flags[config.forceFlag]) {
      return config;
    }
  }

  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (await pathExists(packageJsonPath)) {
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

    for (const man of Object.keys(packageManagers)) {
      if (packageJson.packageManager?.startsWith(man)) {
        return packageManagers[man];
      }
    }
  }

  for (const config of Object.values(packageManagers)) {
    if (await pathExists(path.join(process.cwd(), config.lockFile))) {
      return config;
    }
  }

  return defaultPackageManager;
};

module.exports = {
  getPackageManager,
};
