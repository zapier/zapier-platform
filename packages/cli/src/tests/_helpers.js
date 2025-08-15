const { spawnSync } = require('child_process');
const { readFileSync, realpathSync, writeFileSync, unlinkSync } = require('fs');
const { tmpdir } = require('os');
const { join, resolve } = require('path');
const { randomBytes } = require('crypto');

const IS_WINDOWS = process.platform.startsWith('win');

const runCommand = (cmd, args, opts = {}) => {
  if (IS_WINDOWS) {
    // On Windows, .cmd files are not executable on their own without a shell
    cmd += '.cmd';
    opts = { ...opts, shell: true };
  }

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

const getNewTempDirPath = () => {
  // realpathSync.native() can normalize a Windows path like "C:\Users\ADMINI~1"
  // to "C:\Users\Administrator"
  return join(realpathSync.native(tmpdir()), `zapier-${randomStr()}`);
};

const getLastNonEmptyString = (arr) => {
  let result = null;
  for (let i = arr.length - 1; i >= 0; i--) {
    const str = arr[i].trim();
    if (str) {
      result = str;
      break;
    }
  }
  return result;
};

const npmPackSchema = async () => {
  const schemaDir = resolve(__dirname, '../../../../packages/schema');
  const stdout = runCommand('npm', ['pack'], { cwd: schemaDir });
  const filename = getLastNonEmptyString(stdout.split('\n'));
  const filePath = join(schemaDir, filename);
  return {
    path: filePath,
    cleanup: () => {
      unlinkSync(filePath);
    },
  };
};

// TODO: Fix duplicate code with packages/core/smoke-test.js
const npmPackCore = async () => {
  const { cleanup: cleanupSchema, path: schemaPath } = await npmPackSchema();

  // Patch core's package.json to use schema from local
  const coreDir = resolve(__dirname, '../../../../packages/core');
  const corePackageJsonPath = join(coreDir, 'package.json');
  const originalPackageJsonText = readFileSync(corePackageJsonPath, {
    encoding: 'utf8',
  });
  const corePackageJson = JSON.parse(originalPackageJsonText);
  corePackageJson.dependencies['zapier-platform-schema'] = `file:${schemaPath}`;
  writeFileSync(corePackageJsonPath, JSON.stringify(corePackageJson));

  let stdout;
  try {
    stdout = runCommand('npm', ['pack'], { cwd: coreDir });
  } finally {
    writeFileSync(corePackageJsonPath, originalPackageJsonText);
  }

  const filename = getLastNonEmptyString(stdout.split('\n'));
  const filePath = join(coreDir, filename);

  return {
    path: filePath,
    cleanup: () => {
      cleanupSchema();
      unlinkSync(filePath);
    },
  };
};

module.exports = {
  IS_WINDOWS,
  getNewTempDirPath,
  npmPackCore,
  randomStr,
  runCommand,
};
