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

// Traverse up directory tree to find something (max 5 levels)
const MAX_UPWARD_LEVELS = 5;
const findUpward = async (startDir, predicate) => {
  let dir = startDir;
  for (let i = 0; i < MAX_UPWARD_LEVELS; i++) {
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

  // 2. Traverse up: check packageManager field, then lock files per directory
  const found = await findUpward(process.cwd(), async (dir) => {
    // First, check packageManager field in package.json
    const pkgPath = path.join(dir, 'package.json');
    if (await pathExists(pkgPath)) {
      let pkg;
      try {
        pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));
      } catch {
        pkg = null;
      }
      if (pkg?.packageManager) {
        for (const [name, config] of Object.entries(packageManagers)) {
          if (pkg.packageManager.startsWith(name)) {
            return config;
          }
        }
      }
    }

    // Then, check lock files
    for (const config of Object.values(packageManagers)) {
      const lockPath = path.join(dir, config.lockFile);
      if (await pathExists(lockPath)) {
        return config;
      }
    }

    return null;
  });

  return found || defaultPackageManager;
};

module.exports = {
  getPackageManager,
};
