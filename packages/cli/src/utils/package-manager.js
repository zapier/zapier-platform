const { pathExists, readFile } = require('fs-extra');
const path = require('path');
const debug = require('debug')('zapier:package-manager');

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
  debug('Detecting package manager from:', process.cwd());

  // 1. Check force flags
  for (const config of Object.values(packageManagers)) {
    if (config.forceFlag && flags[config.forceFlag]) {
      debug('Using forced package manager:', config.executable);
      return config;
    }
  }

  // 2. Check packageManager field in package.json (traverse up)
  let foundDir = null;
  const pmFromPkgJson = await findUpward(process.cwd(), async (dir) => {
    const pkgPath = path.join(dir, 'package.json');
    if (await pathExists(pkgPath)) {
      const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));
      if (pkg.packageManager) {
        debug(
          'Found packageManager field "%s" in %s',
          pkg.packageManager,
          pkgPath,
        );
        for (const [name, config] of Object.entries(packageManagers)) {
          if (pkg.packageManager.startsWith(name)) {
            foundDir = dir;
            return config;
          }
        }
      }
    }
    return null;
  });
  if (pmFromPkgJson) {
    debug(
      'Detected %s from packageManager field in %s',
      pmFromPkgJson.executable,
      foundDir,
    );
    return pmFromPkgJson;
  }

  // 3. Check for lock files (traverse up, check all lock files per directory)
  const foundLock = await findUpward(process.cwd(), async (dir) => {
    for (const config of Object.values(packageManagers)) {
      const lockPath = path.join(dir, config.lockFile);
      if (await pathExists(lockPath)) {
        debug('Found lock file: %s', lockPath);
        return { config, dir };
      }
    }
    return null;
  });
  if (foundLock) {
    debug(
      'Detected %s from lock file in %s',
      foundLock.config.executable,
      foundLock.dir,
    );
    return foundLock.config;
  }

  debug('No package manager detected, defaulting to npm');
  return defaultPackageManager;
};

module.exports = {
  getPackageManager,
};
