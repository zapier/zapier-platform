const { resolve } = require('path');
const tmp = require('tmp');

const { startSpinner, endSpinner } = require('./display');
const {
  confirmNonEmptyDir,
  copyDir,
  removeDir,
  ensureDir
} = require('./files');

const initApp = (context, location, createApp) => {
  const appDir = resolve(location);
  const tempAppDir = tmp.tmpNameSync();

  const copyOpts = {
    clobber: false,
    onCopy: file => {
      startSpinner(`Copy ${file}`);
      endSpinner();
    },
    onSkip: file => {
      startSpinner(`File ${file} already exists (skipped)`);
      endSpinner();
    }
  };

  return confirmNonEmptyDir(location)
    .then(() => removeDir(tempAppDir))
    .then(() => ensureDir(tempAppDir))
    .then(() => createApp(tempAppDir))
    .then(() => ensureDir(appDir))
    .then(() => copyDir(tempAppDir, appDir, copyOpts))
    .then(() => removeDir(tempAppDir));
};

const oInitApp = async (path, createFunc) => {
  const appDir = resolve(path);
  const tempAppDir = tmp.tmpNameSync();

  const copyOpts = {
    clobber: false,
    onCopy: file => {
      startSpinner(`Copying ${file}`);
      endSpinner();
    },
    onSkip: file => {
      startSpinner(`File ${file} already exists (skipped)`);
      endSpinner();
    }
  };

  await removeDir(tempAppDir);
  await ensureDir(tempAppDir);
  await createFunc(tempAppDir);
  await ensureDir(appDir);
  await copyDir(tempAppDir, appDir, copyOpts);
  await removeDir(tempAppDir);
};

module.exports = {
  initApp,
  oInitApp
};
