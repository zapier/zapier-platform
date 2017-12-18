'use strict';

const applyMiddleware = require('./middleware');
const schemaTools = require('./tools/schema');

// before middles
const injectZObject = require('./app-middlewares/before/z-object');
const addAppContext = require('./app-middlewares/before/add-app-context');

// after middles
const checkOutput = require('./app-middlewares/after/checks');
const largeResponseCachePointer = require('./app-middlewares/after/large-response-cacher');
const waitForPromises = require('./app-middlewares/after/wait-for-promises');

const createCommandHandler = require('./create-command-handler');

/*
   Create a z-app from an app definition.

   Applies standard middlewares that we want on every z-app, but
   caller can supply custom before and after middlewares.
*/
const createApp = appRaw => {
  const frozenCompiledApp = schemaTools.prepareApp(appRaw);

  // standard before middlewares
  const befores = [addAppContext, injectZObject];

  // standard after middlewares
  const afters = [checkOutput, largeResponseCachePointer, waitForPromises];

  const app = createCommandHandler(frozenCompiledApp);
  return applyMiddleware(befores, afters, app);
};

module.exports = createApp;
