'use strict';

const domain = require('domain'); // eslint-disable-line n/no-deprecated-api
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
const wrapFetchWithLogger = require('./fetch-logger');
const ZapierPromise = require('./promise');

const isDefinedPrimitive = (value) => {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
};

const shouldFullyReplace = (path) => {
  // covers inputFields, outputFields, sample, throttle, etc
  const isOperation = path[path.length - 2] === 'operation';
  return isOperation;
};

const extendAppRaw = (base, extension, path) => {
  if (extension === undefined) {
    return base;
  } else if (isDefinedPrimitive(extension)) {
    return extension;
  } else if (Array.isArray(extension)) {
    return [...extension];
  } else if (_.isPlainObject(extension)) {
    path = path || [];
    if (shouldFullyReplace(path)) {
      return extension;
    } else {
      const baseObject = _.isPlainObject(base) ? base : {};
      const result = { ...baseObject };
      for (const [key, value] of Object.entries(extension)) {
        const newPath = [...path, key];
        result[key] = extendAppRaw(baseObject[key], value, newPath);
      }
      return result;
    }
  }
  throw new TypeError('Unexpected extension type');
};

const mayMoveCreatesToResourcesInExtension = (base, extension) => {
  // The backend sends an extension for creates.KEY.operation.perform as a
  // special case for legacy-scripting-runner.
  // For details, see the MR description at
  // https://gitlab.com/zapier/zapier/-/merge_requests/57964
  //
  // We need to make sure that 'creates.{key}Create' in extension won't collide
  // with 'resources.{key}.create' in base. Otherwise, the checks in
  // compileApp() will throw an error. So here we move 'creates.{key}Create' to
  // 'resources.{key}.create' in extension if base has 'resources.{key}.create'.
  //
  // There's a regression test: Search for 'resource key collision' in
  // integration-test.js.
  if (
    !_.isPlainObject(base.resources) ||
    !_.isPlainObject(extension.creates) ||
    _.isEmpty(base.resources) ||
    _.isEmpty(extension.creates)
  ) {
    return extension;
  }

  const creates = extension.creates;
  extension.creates = {};
  extension.resources = extension.resources || {};

  for (const [key, resource] of Object.entries(base.resources)) {
    const standaloneCreate = creates[key + 'Create'];
    if (resource.create && standaloneCreate) {
      delete standaloneCreate.key;
      delete standaloneCreate.noun;
      extension.resources[key] = {
        ...extension.resources[key],
        create: standaloneCreate,
      };
    }
  }

  return extension;
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
        appRawExtension = mayMoveCreatesToResourcesInExtension(
          appRawOverride,
          appRawExtension,
        );
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
    const appRaw = _.isString(appRawOrPath)
      ? require(appRawOrPath)
      : appRawOrPath;

    if (event && event.appRawOverride) {
      if (
        Array.isArray(event.appRawOverride) &&
        event.appRawOverride.length > 1 &&
        !event.appRawOverride[0]
      ) {
        event.appRawOverride[0] = appRaw;
      }

      return getAppRawOverride(rpc, event.appRawOverride)
        .then((appRawOverride) => resolve(appRawOverride))
        .catch((err) => reject(err));
    }

    return resolve(appRaw);
  });
};

const createLambdaHandler = (appRawOrPath) => {
  const handler = (event, context, callback) => {
    // Wait for all async events to complete before callback returns.
    // This is not strictly necessary since this is the default now when
    // using the callback; just putting it here to be explicit.
    // In some cases, the code hangs and never exits because the event loop is not
    // empty, so we can override the default behavior and exit after the app is done.
    context.callbackWaitsForEmptyEventLoop = true;
    if (event.skipWaitForAsync === true) {
      context.callbackWaitsForEmptyEventLoop = false;
    }

    // replace native Promise with bluebird (works better with domains)
    if (!event.calledFromCli || event.calledFromCliInvoke) {
      ZapierPromise.patchGlobal();
    }

    // If we're running out of memory or file descriptors, force exit the process.
    // The backend will try again via @retry(ProcessExitedException).
    checkMemory(event);

    environmentTools.cleanEnvironment();

    // Copy bundle environment into process.env *before* creating the logger and
    // loading app code, so that the logger gets the endpoint from process.env,
    // and top level app code can get bundle environment vars via process.env.
    environmentTools.applyEnvironment(event);

    // Create logger outside of domain, so we can use in both error and run callbacks.
    const logBuffer = [];
    const logger = createLogger(event, { logBuffer });

    let isCallbackCalled = false;
    const callbackOnce = (err, resp) => {
      logger.end().finally(() => {
        if (!isCallbackCalled) {
          isCallbackCalled = true;
          callback(err, resp);
        }
      });
    };

    const logErrorAndCallbackOnce = (logMsg, logData, err) => {
      logger(logMsg, logData);

      // Check for `.message` in case someone did `throw "My Error"`
      if (!constants.IS_TESTING && err && !err.doNotContextify && err.message) {
        err.message += `\n\nConsole logs:\n${logBuffer
          .map((s) => `  ${s.message}`)
          .join('')}`;
      }

      callbackOnce(err);
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
      const rpc = createRpcClient(event);

      return loadApp(event, rpc, appRawOrPath)
        .then((appRaw) => {
          const app = createApp(appRaw);

          const { skipHttpPatch } = appRaw.flags || {};
          // Adds logging for _all_ kinds of http(s) requests, no matter the library
          if (
            !skipHttpPatch &&
            (!event.calledFromCli || event.calledFromCliInvoke)
          ) {
            const httpPatch = createHttpPatch(event);
            httpPatch(require('http'), logger);
            httpPatch(require('https'), logger); // 'https' needs to be patched separately
            if (global.fetch) {
              global.fetch = wrapFetchWithLogger(global.fetch, logger);
            }
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
