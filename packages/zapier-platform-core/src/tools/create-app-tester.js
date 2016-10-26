'use strict';

const createLambdaHandler = require('./create-lambda-handler');
const resolveMethodPath = require('./resolve-method-path');
const ZapierPromise = require('./promise');

// Convert a app handler to promise for convenience.
const promisifyHandler = (handler) => {
  return (event) => {
    return new ZapierPromise((resolve, reject) => {
      handler(event, {}, (err, resp) => {
        if (err) { reject(err); }
        else { resolve(resp); }
      });
    });
  };
};

// A shorthand compatible wrapper for testing.
const createAppTester = (appRaw) => {
  const handler = createLambdaHandler(appRaw);
  const createHandlerPromise = promisifyHandler(handler);

  return (methodOrFunc, bundle) => {
    bundle = bundle || {};

    const method = resolveMethodPath(appRaw, methodOrFunc);

    const event = {
      command: 'execute',
      method,
      bundle
    };

    if (process.env.LOG_TO_STDOUT) {
      event.logToStdout = true;
    }
    if (process.env.DETAILED_LOG_TO_STDOUT) {
      event.detailedLogToStdout = true;
    }

    return createHandlerPromise(event).then(resp => resp.results);
  };
};

module.exports = createAppTester;
