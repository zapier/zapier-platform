const { resolve } = require('path');
const tmp = require('tmp');

const { startSpinner, endSpinner } = require('./display');
const { copyDir, removeDir, ensureDir } = require('./files');

const initApp = async (path, createFunc) => {
  const appDir = resolve(path);
  const tempAppDir = tmp.tmpNameSync();

  const copyOpts = {
    clobber: false,
    onCopy: (file) => {
      startSpinner(`Copying ${file}`);
      endSpinner();
    },
    onSkip: (file) => {
      startSpinner(`File ${file} already exists (skipped)`);
      endSpinner();
    },
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
};
