// XDG Base Directory Specification
// See: https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html

const fse = require('fs-extra');
const os = require('os');
const path = require('path');

const ensureDir = (envVarName, defaultDir, extraPath = []) => {
  const baseDir = process.env[envVarName] || defaultDir;
  let appDir = path.join(baseDir, 'zapier');
  fse.ensureDirSync(appDir, 0o700);

  if (extraPath.length > 0) {
    const dirParts = [appDir].concat(extraPath);
    appDir = path.join.apply(null, dirParts);
    fse.ensureDirSync(appDir);
  }

  return appDir;
};

const HOME_DIR = os.homedir();

let ensureDataDir, ensureCacheDir, ensureConfigDir;

if (process.platform === 'win32') {
  const defaultAppDir = path.join(HOME_DIR, 'AppData', 'Local');

  // NOTE: LOCALAPPDATA is not available on Windows XP
  ensureDataDir = ensureDir.bind(null, 'LOCALAPPDATA', defaultAppDir, ['data']);
  ensureCacheDir = ensureDir.bind(null, 'LOCALAPPDATA', defaultAppDir, [
    'cache',
  ]);
  ensureConfigDir = ensureDir.bind(null, 'LOCALAPPDATA', defaultAppDir, [
    'config',
  ]);
} else {
  ensureDataDir = ensureDir.bind(
    null,
    'XDG_DATA_HOME',
    path.join(HOME_DIR, '.local', 'share'),
  );
  ensureCacheDir = ensureDir.bind(
    null,
    'XDG_CACHE_HOME',
    path.join(HOME_DIR, '.cache'),
  );
  ensureConfigDir = ensureDir.bind(
    null,
    'XDG_CONFIG_HOME',
    path.join(HOME_DIR, '.config'),
  );
}

module.exports = {
  ensureDataDir,
  ensureCacheDir,
  ensureConfigDir,
};
