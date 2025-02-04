const { findCorePackageDir } = require('./misc');

const getLocalAppHandler = async () => {
  const corePackageDir = findCorePackageDir();
  let appRaw, zapier;

  try {
    appRaw = await import(`${process.cwd()}/index.js`);
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
  localAppCommand,
};
