'use strict';

const applyMiddleware = require('./middleware');
const ensureArray = require('./tools/ensure-array');
const schemaTools = require('./tools/schema');

// before middles
const injectZObject = require('./app-middlewares/before/z-object');
const addAppContext = require('./app-middlewares/before/add-app-context');

// after middles
const checkOutput = require('./app-middlewares/after/checks');
const largeResponseCachePointer = require('./app-middlewares/after/large-response-cacher');
const callbackStatusCatcher = require('./app-middlewares/after/callback-status-catcher');
const waitForPromises = require('./app-middlewares/after/wait-for-promises');

const createCommandHandler = require('./create-command-handler');

/*
   Create a z-app from an app definition.

   Applies standard middlewares that we want on every z-app, but
   caller can supply custom before and after middlewares.
*/
const createApp = (appRaw) => {
  const frozenCompiledApp = schemaTools.prepareApp(appRaw);

  // standard before middlewares
  const befores = [
    addAppContext,
    injectZObject,
    ...ensureArray(frozenCompiledApp.beforeApp),
  ];

  // standard after middlewares
  const afters = [
    checkOutput,
    largeResponseCachePointer,
    waitForPromises,
    callbackStatusCatcher,
    ...ensureArray(frozenCompiledApp.afterApp),
  ];

  const app = createCommandHandler(frozenCompiledApp);
  return applyMiddleware(befores, afters, app);
};

module.exports = createApp;
