const _ = require('lodash');
const path = require('path');

const { PLATFORM_PACKAGE } = require('../constants');

const getLocalAppHandler = ({ reload = false, baseEvent = {} } = {}) => {
  const entryPath = `${process.cwd()}/index`;
  const rootPath = path.dirname(require.resolve(entryPath));
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
    zapier = require(`${rootPath}/node_modules/${PLATFORM_PACKAGE}`);
  } catch (err) {
    // this err.stack doesn't give a nice traceback at all :-(
    // maybe we could do require('syntax-error') in the future
    return (event, ctx, callback) => callback(err);
  }
  const handler = zapier.createAppHandler(appRaw);
  return (event, ctx, callback) => {
    event = _.merge(
      {},
      event,
      {
        calledFromCli: true,
      },
      baseEvent
    );
    handler(event, _, callback);
  };
};

// Runs a local app command (./index.js) like {command: 'validate'};
const localAppCommand = (event) => {
  const handler = getLocalAppHandler();
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
