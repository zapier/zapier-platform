'use strict';

const createLambdaHandler = require('./create-lambda-handler');
const resolveMethodPath = require('./resolve-method-path');
const ZapierPromise = require('./promise');
const { isFunction } = require('lodash');
const { genId } = require('./data');
const { shouldPaginate } = require('./should-paginate');

// Convert a app handler to promise for convenience.
const promisifyHandler = (handler) => {
  return (event) => {
    return new ZapierPromise((resolve, reject) => {
      handler(event, {}, (err, resp) => {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  };
};

// A shorthand compatible wrapper for testing.
const createAppTester = (appRaw, { customStoreKey } = {}) => {
  const handler = createLambdaHandler(appRaw);
  const createHandlerPromise = promisifyHandler(handler);

  const randomSeed = genId();

  const appTester = (methodOrFunc, bundle, clearZcacheBeforeUse = false) => {
    bundle = bundle || {};

    let method = resolveMethodPath(appRaw, methodOrFunc, false);
    if (!method) {
      if (isFunction(methodOrFunc)) {
        // definitely have a function but didn't find it on the app; it's an adhoc
        appRaw._testRequest = (z, bundle) => methodOrFunc(z, bundle);
        method = resolveMethodPath(appRaw, appRaw._testRequest);
      } else {
        throw new Error(
          `Unable to find the following on your App instance: ${JSON.stringify(
            methodOrFunc,
          )}`,
        );
      }
    }

    const storeKey = shouldPaginate(appRaw, method)
      ? customStoreKey
        ? `testKey-${customStoreKey}`
        : `testKey-${method}-${randomSeed}`
      : null;

    if (clearZcacheBeforeUse) {
      appTester.zcacheTestObj = {};
    }

    const event = {
      command: 'execute',
      method,
      bundle,
      storeKey,
      callback_url: 'https://auth-json-server.zapier-staging.com/echo',
      zcacheTestObj: appTester.zcacheTestObj,
    };

    if (process.env.LOG_TO_STDOUT) {
      event.logToStdout = true;
    }
    if (process.env.DETAILED_LOG_TO_STDOUT) {
      event.detailedLogToStdout = true;
    }

    return createHandlerPromise(event).then((resp) => {
      delete appRaw._testRequest; // clear adHocFunc so tests can't affect each other
      return resp.results;
    });
  };

  appTester.zcacheTestObj = {};

  return appTester;
};

module.exports = createAppTester;
