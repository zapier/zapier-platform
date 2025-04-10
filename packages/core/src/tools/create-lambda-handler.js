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

const getAppRawOverride = async (rpc, appRawOverride) => {
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
      return appRawOverride;
    }
  } else if (typeof appRawOverride === 'object') {
    return appRawOverride;
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
    return appRawOverride;
  }

  const fetchedOverride = await rpc('get_definition_override');

  // store or "cache" override

  fs.writeFileSync(hashPath, appRawOverride);
  fs.writeFileSync(overridePath, JSON.stringify(fetchedOverride));

  return extendAppRaw(fetchedOverride, appRawExtension);
};

const loadApp = async (event, rpc, appRawOrPath) => {
  let appRaw;
  if (typeof appRawOrPath === 'string') {
    // CommonJS route - most CLI integrations go through here.
    const appPath = appRawOrPath;
    appRaw = require(appPath);
  } else {
    // ESM route - CLI integrations that use ESM go through here.
    // Some tests and UI "buildless" integrations also use this route.
    appRaw = appRawOrPath;
  }

  if (event && event.appRawOverride) {
    if (
      Array.isArray(event.appRawOverride) &&
      event.appRawOverride.length > 1 &&
      !event.appRawOverride[0]
    ) {
      event.appRawOverride[0] = appRaw;
    }

    return getAppRawOverride(rpc, event.appRawOverride);
  }

  return appRaw;
};

const createLambdaHandler = (appRawOrPath) => {
  const handler = async (event, context = {}) => {
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

    const logErrorAndReturn = async (logMsg, logData, err) => {
      await logger(logMsg, logData);

      // Check for `.message` in case someone did `throw "My Error"`
      if (!constants.IS_TESTING && err && !err.doNotContextify && err.message) {
        err.message += `\n\nConsole logs:\n${logBuffer
          .map((s) => `  ${s.message}`)
          .join('')}`;
      }

      return err;
    };

    const handlerDomain = domain.create();

    // TODO ideally we should not use a promise here
    // also ideally we could remove domain since it's deprecated...
    return new Promise((resolve, reject) => {
      handlerDomain.on('error', async (err) => {
        // This error handler is only called when someone (we or devs) missed
        // catching an error in a callback. Errors thrown by promises should be
        // already caught by the try-catch below.
        // Notice this one starts with "Uncaught error" while the other one starts
        // with "Unhandled error". You can use this to distinguish between them in
        // the logs.
        const logMsg = `Uncaught error: ${err}\n${
          (err && err.stack) || '<stack>'
        }`;
        const logData = { err, log_type: 'error' };
        const loggedErr = await logErrorAndReturn(logMsg, logData, err);
        reject(loggedErr);
      });

      handlerDomain.run(async () => {
        const rpc = createRpcClient(event);

        try {
          const appRaw = await loadApp(event, rpc, appRawOrPath);
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
          const output = await app(input);
          const result = cleaner.maskOutput(output);
          resolve(result);
        } catch (err) {
          const logMsg = `Unhandled error: ${err}\n${
            (err && err.stack) || '<stack>'
          }`;
          const logData = { err, log_type: 'error' };
          const loggedErr = await logErrorAndReturn(logMsg, logData, err);
          reject(loggedErr);
        } finally {
          await logger.end();
        }
      });
    });
  };

  return handler;
};

module.exports = createLambdaHandler;
