const { findCorePackageDir, runCommand } = require('./misc');
const { copyZapierWrapper, deleteZapierWrapper } = require('./zapierwrapper');

const getLocalAppHandler = async () => {
  const corePackageDir = findCorePackageDir();
  const appDir = process.cwd();
  const wrapperPath = await copyZapierWrapper(corePackageDir, appDir);

  let app;
  try {
    app = await import(wrapperPath);
  } catch (err) {
    if (err.name === 'SyntaxError') {
      // Run a separate process to print the line number of the SyntaxError.
      // This workaround is needed because `err` doesn't provide the location
      // info about the SyntaxError. However, if the error is thrown to
      // Node.js's built-in error handler, it will print the location info.
      // See: https://github.com/nodejs/node/issues/49441
      await runCommand(process.execPath, ['zapierwrapper.js'], {
        cwd: appDir,
      });
    }
    throw err;
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
