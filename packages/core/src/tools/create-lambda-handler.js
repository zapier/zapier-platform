'use strict';

const domain = require('domain'); // eslint-disable-line node/no-deprecated-api
const fs = require('fs');
const os = require('os');
const path = require('path');

const _ = require('lodash');

const checkMemory = require('./memory-checker');
const cleaner = require('./cleaner');
const constants = require('../constants');
const createApp = require('../create-app');
const createHttpPatch = require('./create-http-patch');
const createInput = require('./create-input');
const createLogger = require('./create-logger');
const createRpcClient = require('./create-rpc-client');
const environmentTools = require('./environment');
const schemaTools = require('./schema');
const ZapierPromise = require('./promise');

const RequestSchema = require('zapier-platform-schema/lib/schemas/RequestSchema');
const FunctionSchema = require('zapier-platform-schema/lib/schemas/FunctionSchema');

const isRequestOrFunction = (obj) => {
  return (
    RequestSchema.validate(obj).valid || FunctionSchema.validate(obj).valid
  );
};

const extendAppRaw = (base, extension) => {
  const keysToOverride = [
    'test',
    'perform',
    'performList',
    'performSubscribe',
    'performUnsubscribe',
  ];
  const concatArrayAndOverrideKeys = (objValue, srcValue, key) => {
    if (Array.isArray(objValue) && Array.isArray(srcValue)) {
      return objValue.concat(srcValue);
    }

    if (
      // Do full replacement when it comes to keysToOverride
      keysToOverride.indexOf(key) !== -1 &&
      _.isPlainObject(srcValue) &&
      _.isPlainObject(objValue) &&
      isRequestOrFunction(srcValue) &&
      isRequestOrFunction(objValue)
    ) {
      return srcValue;
    }

    return undefined;
  };
  return _.mergeWith(base, extension, concatArrayAndOverrideKeys);
};

const getAppRawOverride = (rpc, appRawOverride) => {
  return new ZapierPromise((resolve, reject) => {
    let appRawExtension;
    if (Array.isArray(appRawOverride) && appRawOverride.length > 1) {
      // If appRawOverride is too big, we send an md5 hash instead of JSON, so
      // appRawOverride can be:
      // - [appDefinition, {'creates': {'foo': {...}}}]
      // - ['<hash>', {'creates': {'foo': {...}}}] if appRawOverride is too big
      appRawExtension = appRawOverride[1];
      appRawOverride = appRawOverride[0];

      if (typeof appRawOverride !== 'string') {
        appRawOverride = extendAppRaw(appRawOverride, appRawExtension);
        resolve(appRawOverride);
        return;
      }
    } else if (typeof appRawOverride === 'object') {
      resolve(appRawOverride);
      return;
    }

    // Lambda keeps the container and /tmp directory around for a bit,
    // so we can use that to "cache" the hash and override we fetched
    // from RPC before.
    const tmpdir = os.tmpdir();
    const overridePath = path.join(tmpdir, 'cli-override.json');
    const hashPath = path.join(tmpdir, 'cli-hash.txt');

    // Check if it's "cached", to prevent unnecessary RPC calls
    if (
      fs.existsSync(hashPath) &&
      fs.existsSync(overridePath) &&
      fs.readFileSync(hashPath).toString() === appRawOverride
    ) {
      appRawOverride = JSON.parse(fs.readFileSync(overridePath).toString());
      appRawOverride = extendAppRaw(appRawOverride, appRawExtension);
      resolve(appRawOverride);
      return;
    }

    // Otherwise just get it via RPC
    rpc('get_definition_override')
      .then((fetchedOverride) => {
        // "cache" it.
        fs.writeFileSync(hashPath, appRawOverride);
        fs.writeFileSync(overridePath, JSON.stringify(fetchedOverride));

        fetchedOverride = extendAppRaw(fetchedOverride, appRawExtension);

        resolve(fetchedOverride);
      })
      .catch((err) => reject(err));
  });
};

// Sometimes tests want to pass in an app object defined directly in the test,
// so allow for that, and an event.appRawOverride for "buildless" apps.
const loadApp = (event, rpc, appRawOrPath) => {
  return new ZapierPromise((resolve, reject) => {
    if (event && event.appRawOverride) {
      return getAppRawOverride(rpc, event.appRawOverride)
        .then((appRawOverride) => resolve(appRawOverride))
        .catch((err) => reject(err));
    }

    if (_.isString(appRawOrPath)) {
      return resolve(require(appRawOrPath));
    }

    return resolve(appRawOrPath);
  });
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
        // Check for `.message` in case someone did `throw "My Error"`
        if (
          !constants.IS_TESTING &&
          err &&
          !err.doNotContextify &&
          err.message
        ) {
          err.message += `\n\nConsole logs:\n${logBuffer
            .map((s) => `  ${s.message}`)
            .join('')}`;
        }
        callbackOnce(err);
      });
    };

    const handlerDomain = domain.create();

    handlerDomain.on('error', (err) => {
      const logMsg = `Uncaught error: ${err}\n${
        (err && err.stack) || '<stack>'
      }`;
      const logData = { err, log_type: 'error' };
      logErrorAndCallbackOnce(logMsg, logData, err);
    });

    handlerDomain.run(() => {
      // Copy bundle environment into process.env *before* loading app code,
      // so that top level app code can get bundle environment vars via process.env.
      environmentTools.applyEnvironment(event);

      const rpc = createRpcClient(event);

      return loadApp(event, rpc, appRawOrPath)
        .then((appRaw) => {
          const app = createApp(appRaw);

          const { skipHttpPatch } = appRaw.flags || {};
          // Adds logging for _all_ kinds of http(s) requests, no matter the library
          if (!skipHttpPatch) {
            const httpPatch = createHttpPatch(event);
            httpPatch(require('http')); // 'https' uses 'http' under the hood
          }

          // TODO: Avoid calling prepareApp(appRaw) repeatedly here as createApp()
          // already calls prepareApp() but just doesn't return it.
          const compiledApp = schemaTools.prepareApp(appRaw);

          const input = createInput(compiledApp, event, logger, logBuffer, rpc);
          return app(input);
        })
        .then((output) => {
          callbackOnce(null, cleaner.maskOutput(output));
        })
        .catch((err) => {
          const logMsg = `Unhandled error: ${err}\n${
            (err && err.stack) || '<stack>'
          }`;
          const logData = { err, log_type: 'error' };
          logErrorAndCallbackOnce(logMsg, logData, err);
        });
    });
  };

  return handler;
};

module.exports = createLambdaHandler;
