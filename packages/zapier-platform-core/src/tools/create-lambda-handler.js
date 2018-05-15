'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const domain = require('domain');

const constants = require('../constants');
const createApp = require('../create-app');
const createLogger = require('./create-logger');
const createInput = require('./create-input');
const cleaner = require('./cleaner');
const ZapierPromise = require('./promise');
const environmentTools = require('./environment');
const checkMemory = require('./memory-checker');
const createRpcClient = require('./create-rpc-client');
const createHttpPatch = require('./create-http-patch');

const getAppRawOverride = (rpc, appRawOverride) => {
  return new ZapierPromise((resolve, reject) => {
    // Lambda keeps the container and /tmp directory around for a bit,
    // so we can use that to "cache" the hash and override we fetched
    // from RPC before.
    const overridePath = path.join('/tmp', 'cli-override.json');
    const hashPath = path.join('/tmp', 'cli-hash.txt');

    // If appRawOverride is too big, we send an md5 hash instead of JSON
    if (!_.isString(appRawOverride)) {
      return resolve(appRawOverride);
    }

    // Check if it's "cached", to prevent unnecessary RPC calls
    if (
      fs.existsSync(hashPath) &&
      fs.existsSync(overridePath) &&
      fs.readFileSync(hashPath).toString() === appRawOverride
    ) {
      return resolve(JSON.parse(fs.readFileSync(overridePath).toString()));
    }

    // Otherwise just get it via RPC
    return rpc('get_definition_override')
      .then(fetchedOverride => {
        // "cache" it.
        fs.writeFileSync(hashPath, appRawOverride);
        fs.writeFileSync(overridePath, JSON.stringify(fetchedOverride));

        resolve(fetchedOverride);
      })
      .catch(err => reject(err));
  });
};

// Sometimes tests want to pass in an app object defined directly in the test,
// so allow for that, and an event.appRawOverride for "buildless" apps.
const loadApp = (event, rpc, appRawOrPath) => {
  return new ZapierPromise((resolve, reject) => {
    if (event && event.appRawOverride) {
      return getAppRawOverride(rpc, event.appRawOverride)
        .then(appRawOverride => resolve(appRawOverride))
        .catch(err => reject(err));
    }

    if (_.isString(appRawOrPath)) {
      return resolve(require(appRawOrPath));
    }

    return resolve(appRawOrPath);
  });
};

const createLambdaHandler = appRawOrPath => {
  const handler = (event, context, callback) => {
    // Adds logging for _all_ kinds of http(s) requests, no matter the library
    const httpPatch = createHttpPatch(event);
    httpPatch(require('http')); // 'https' uses 'http' under the hood

    // Wait for all async events to complete before callback returns.
    // This is not strictly necessary since this is the default now when
    // using the callback; just putting it here to be explicit.
    context.callbackWaitsForEmptyEventLoop = true;

    // replace native Promise with bluebird (works better with domains)
    if (!event.calledFromCli) {
      ZapierPromise.patchGlobal();
    }

    // If we're running out of memory, exit the process. Backend will try again.
    checkMemory(event);

    environmentTools.cleanEnvironment();

    // Create logger outside of domain, so we can use in both error and run callbacks.
    const logBuffer = [];
    const logger = createLogger(event, { logBuffer });

    let isCallbackCalled = false;
    const callbackOnce = (err, resp) => {
      if (!isCallbackCalled) {
        isCallbackCalled = true;
        callback(err, resp);
      }
    };

    const logErrorAndCallbackOnce = (logMsg, logData, err) => {
      // Wait for logger to complete before callback. This isn't
      // strictly necessary because callbacksWaitsForEmptyLoop is
      // the default behavior with callbacks anyway, but don't want
      // to rely on that.
      logger(logMsg, logData).then(() => {
        if (!constants.IS_TESTING) {
          err.message +=
            '\n\nConsole logs:\n' +
            logBuffer.map(s => `  ${s.message}`).join('');
        }
        callbackOnce(err);
      });
    };

    const handlerDomain = domain.create();

    handlerDomain.on('error', err => {
      const logMsg = `Uncaught error: ${err}\n${err.stack || '<stack>'}`;
      const logData = { err, log_type: 'error' };
      logErrorAndCallbackOnce(logMsg, logData, err);
    });

    handlerDomain.run(() => {
      // Copy bundle environment into process.env *before* loading app code,
      // so that top level app code can get bundle environment vars via process.env.
      environmentTools.applyEnvironment(event);

      const rpc = createRpcClient(event);

      return loadApp(event, rpc, appRawOrPath)
        .then(appRaw => {
          const app = createApp(appRaw);
          const input = createInput(appRaw, event, logger, logBuffer, rpc);
          return app(input);
        })
        .then(output => {
          callbackOnce(null, cleaner.maskOutput(output));
        })
        .catch(err => {
          const logMsg = `Unhandled error: ${err}\n${err.stack || '<stack>'}`;
          const logData = { err, log_type: 'error' };
          logErrorAndCallbackOnce(logMsg, logData, err);
        });
    });
  };

  return handler;
};

module.exports = createLambdaHandler;
