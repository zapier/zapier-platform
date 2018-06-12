const path = require('path');
const tmp = require('tmp');

const { startSpinner, endSpinner, getYesNoInput } = require('./display');
const { isEmptyDir, copyDir, removeDir, ensureDir } = require('./files');

const confirmNonEmptyDir = location => {
  if (location === '.') {
    return isEmptyDir(location).then(isEmpty => {
      if (!isEmpty) {
        return getYesNoInput(
          'Current directory not empty, continue anyway?',
          false
        ).then(yes => {
          if (!yes) {
            /*eslint no-process-exit: 0 */
            process.exit(0);
          }
        });
      }
      return Promise.resolve();
    });
  }
  return Promise.resolve();
};

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
