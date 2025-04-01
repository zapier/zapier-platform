const { findCorePackageDir, runCommand } = require('./misc');
const { copyZapierWrapper, deleteZapierWrapper } = require('./zapierwrapper');

const getLocalAppHandler = async (appDir, shouldDeleteWrapper) => {
  appDir = appDir || process.cwd();
  const corePackageDir = findCorePackageDir();
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
    if (shouldDeleteWrapper) {
      await deleteZapierWrapper(appDir);
    }
  }

  return async (event, ctx) => {
    event = {
      ...event,
      calledFromCli: true,
    };
    return await app.handler(event, ctx);
  };
};

// Runs a local app command (./index.js) like {command: 'validate'};
const localAppCommand = async (event, appDir, shouldDeleteWrapper = false) => {
  const handler = await getLocalAppHandler(appDir, shouldDeleteWrapper);
  const response = await handler(event, {});
  return response.results;
};

module.exports = {
  localAppCommand,
};
