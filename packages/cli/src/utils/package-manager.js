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

// Traverse up directory tree to find something
const findUpward = async (startDir, predicate) => {
  let dir = startDir;
  for (let i = 0; i < 100; i++) {
    const result = await predicate(dir);
    if (result) {
      return result;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
  return null;
};

const getPackageManager = async (flags = {}) => {
  // 1. Check force flags
  for (const config of Object.values(packageManagers)) {
    if (config.forceFlag && flags[config.forceFlag]) {
      return config;
    }
  }

  // 2. Check packageManager field in package.json (traverse up)
  const pmFromPkgJson = await findUpward(process.cwd(), async (dir) => {
    const pkgPath = path.join(dir, 'package.json');
    if (await pathExists(pkgPath)) {
      const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));
      if (pkg.packageManager) {
        for (const [name, config] of Object.entries(packageManagers)) {
          if (pkg.packageManager.startsWith(name)) {
            return config;
          }
        }
      }
    }
    return null;
  });
  if (pmFromPkgJson) {
    return pmFromPkgJson;
  }

  // 3. Check for lock files (traverse up)
  for (const config of Object.values(packageManagers)) {
    const found = await findUpward(process.cwd(), async (dir) => {
      const lockPath = path.join(dir, config.lockFile);
      return (await pathExists(lockPath)) ? config : null;
    });
    if (found) {
      return found;
    }
  }

  return defaultPackageManager;
};

module.exports = {
  getPackageManager,
};
