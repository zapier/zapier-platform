const _ = require('lodash');
const colors = require('colors');
const path = require('path');

const { PLATFORM_PACKAGE } = require('../constants');

const { prettyJSONstringify } = require('./display');

const { promisify } = require('./promisify');

const nodeWatch = (...args) => require('node-watch')(...args);
const makeTunnelUrl = (...args) => promisify(require('ngrok').connect)(...args);

const getLocalAppHandler = ({ reload = false, baseEvent = {} } = {}) => {
  const entryPath = `${process.cwd()}/index`;
  const rootPath = path.dirname(require.resolve(entryPath));
  if (reload) {
    Object.keys(require.cache).map(cachePath => {
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
        calledFromCli: true
      },
      baseEvent
    );
    handler(event, _, callback);
  };
};

// Runs a local app command (./index.js) like {command: 'validate'};
const localAppCommand = event => {
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

// translate a JS Error into what would be returned from lambda
const createAWSError = error => {
  const stackTrace = error.stack.split(/\n\s+at\s/).slice(1);

  return {
    errorMessage: error.message,
    errorType: error.name,
    stackTrace
  };
};

// Stands up a local tunnel server for app commands.
const localAppTunnelServer = options => {
  const jayson = require('jayson');

  const server = jayson.server({
    test: (args, callback) => {
      callback(null, { results: 'Success!' });
    },
    invoke: (args, callback) => {
      const [event] = args;
      options.log();
      options.log(colors.green('==Method'));
      options.log(event.method);
      options.log(colors.green('==Bundle'));
      options.log(prettyJSONstringify(event.bundle));
      options.handler(event, {}, (err, resp) => {
        if (err) {
          options.log(colors.red(colors.bold('==Error')));
          options.log(err.stack);
          options.log();
        } else {
          options.log(colors.red(colors.bold('==Results')));
          options.log(prettyJSONstringify(resp.results));
          options.log();
        }
        if (err) {
          // match how AWS returns its errors
          const awsError = createAWSError(err);
          callback(null, awsError);
        } else {
          callback(err, resp);
        }
      });
    }
  });

  server.httpServer = server.http();
  server.httpServer.listen(options.port);

  return server;
};

module.exports = {
  getLocalAppHandler,
  localAppCommand,
  localAppTunnelServer,
  makeTunnelUrl,
  nodeWatch
};
