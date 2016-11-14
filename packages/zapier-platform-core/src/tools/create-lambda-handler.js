'use strict';

const _ = require('lodash');
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

// Sometimes tests want to pass in an app object defined directly in the test,
// so allow for that.
const loadApp = (appRawOrPath) => {
  if (_.isString(appRawOrPath)) {
    return require(appRawOrPath);
  }
  return appRawOrPath;
};

const createLambdaHandler = (appRawOrPath) => {

  const handler = (event, context, callback) => {
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
    const logger = createLogger(event, {logBuffer});

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
      logger(logMsg, logData)
        .then(() => {
          if (!constants.IS_TESTING) {
            err.message += '\n\nConsole logs:\n' + logBuffer.map(s => `  ${s.message}`).join('');
          }
          callbackOnce(err);
        });
    };

    const handlerDomain = domain.create();

    handlerDomain.on('error', err => {
      const logMsg = `Uncaught error: ${err}\n${err.stack || '<stack>'}`;
      const logData = {err, log_type: 'error'};
      logErrorAndCallbackOnce(logMsg, logData, err);
    });

    handlerDomain.run(() => {
      // Copy bundle environment into process.env *before* loading app code,
      // so that top level app code can get bundle environment vars via process.env.
      environmentTools.applyEnvironment(event);
      const appRaw = loadApp(appRawOrPath);
      const app = createApp(appRaw);
      const rpc = createRpcClient(event);

      const input = createInput(appRaw, event, logger, logBuffer, rpc);
      return app(input)
        .then((output) => {
          callbackOnce(null, cleaner.maskOutput(output));
        })
        .catch((err) => {
          const logMsg = `Unhandled error: ${err}\n${err.stack || '<stack>'}`;
          const logData = {err, log_type: 'error'};
          logErrorAndCallbackOnce(logMsg, logData, err);
        });
    });
  };

  return handler;

};

module.exports = createLambdaHandler;
