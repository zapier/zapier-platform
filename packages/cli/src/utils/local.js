const { findCorePackageDir } = require('./misc');
const { copyZapierWrapper, deleteZapierWrapper } = require('./zapierwrapper');

const getLocalAppHandler = async () => {
  const corePackageDir = findCorePackageDir();
  const appDir = process.cwd();
  const wrapperPath = await copyZapierWrapper(corePackageDir, appDir);

  let app;
  try {
    app = await import(wrapperPath);
  } finally {
    await deleteZapierWrapper(appDir);
  }

  return (event, ctx, callback) => {
    event = {
      ...event,
      calledFromCli: true,
    };
    app.handler(event, ctx, callback);
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
