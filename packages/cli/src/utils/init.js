const path = require('path');
const tmp = require('tmp');

const { startSpinner, endSpinner } = require('./display');
const {
  confirmNonEmptyDir,
  copyDir,
  removeDir,
  ensureDir
} = require('./files');

const initApp = (context, location, createApp) => {
  const appDir = path.resolve(location);
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

module.exports = {
  initApp
};
