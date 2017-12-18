const path = require('path');
const tmp = require('tmp');

const { printStarting, printDone, getInput } = require('./display');
const { isEmptyDir, copyDir, removeDir, ensureDir } = require('./files');

const confirmNonEmptyDir = location => {
  if (location === '.') {
    return isEmptyDir(location).then(isEmpty => {
      if (!isEmpty) {
        return getInput(
          'Current directory not empty, continue anyway? (y/n) '
        ).then(answer => {
          if (!answer.match(/^y/i)) {
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
      printStarting(`Copy ${file}`);
      printDone();
    },
    onSkip: file => {
      printStarting(`File ${file} already exists`);
      printDone(true, 'skipped');
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
