'use strict';

/*
  Creates input object for the middleware chain, from the app definition,
  AWS event object, and logger function. The logger is a function that
  logs somewhere, and returns a promise.

  The returned input object contains all the very basic, core fields that every
  middleware, *and* our AWS handler function, can depend on and assume exist.
  Subsequent middlewares may stick other things on input (like the z object).
*/
const createInput = (app, event, logger, logBuffer, rpc) => {
  return {
    // Expose bundle to dev apps
    bundle: event.bundle,

    // The _zapier namespace is 'private'. It has things
    // we need, but that dev apps should not need.
    _zapier: {
      // Compiled app definition
      app,

      // The raw AWS event object
      event,

      // List of promises to wait on. Stick unresolved promises on
      // here, and we will wait for them to complete before calling
      // the AWS callback.
      promises: [],

      // Our internal rpc client
      rpc,

      // Logger function that returns a promise
      logger,

      logBuffer,
    },
  };
};

module.exports = createInput;
