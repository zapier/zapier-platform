const path = require('path');

const { findCorePackageDir } = require('./misc');

const getLocalAppHandler = ({ reload = false, baseEvent = {} } = {}) => {
  const entryPath = `${process.cwd()}/index`;
  const rootPath = path.dirname(require.resolve(entryPath));
  const corePackageDir = findCorePackageDir();

  if (reload) {
    Object.keys(require.cache).forEach((cachePath) => {
      if (cachePath.startsWith(rootPath)) {
        delete require.cache[cachePath];
      }
    });
  }
  let appRaw, zapier;
  try {
    appRaw = require(entryPath);
    zapier = require(corePackageDir);
  } catch (err) {
    // this err.stack doesn't give a nice traceback at all :-(
    // maybe we could do require('syntax-error') in the future
    return (event, ctx, callback) => callback(err);
  }

  if (appRaw && appRaw.default) {
    appRaw = appRaw.default;
  }

  const handler = zapier.createAppHandler(appRaw);
  return (event, ctx, callback) => {
    event = {
      ...event,
      calledFromCli: true,
    };
    handler(event, ctx, callback);
  };
};

// Runs a local app command (./index.js) like {command: 'validate'};
const localAppCommand = async (event) => {
  const handler = await getLocalAppHandler();
  return new Promise((resolve, reject) => {
    handler(event, {}, (err, resp) => {
      if (err) {
        reject(err);
      } else {
        resolve(resp.results);
      }
    });
  });
};

module.exports = {
  getLocalAppHandler,
  localAppCommand,
};
