'use strict';

const createLoggerConsole = require('./create-logger-console');

/**
 * Shared console instance that can be used standalone or as z.console.
 * Uses createLoggerConsole to create the single instance shared between both.
 */

// Shared console instance - will be initialized by middleware
let loggerConsole = null;

/**
 * Initialize the console with the input context from middleware.
 * This is called by the z-object middleware and uses createLoggerConsole.
 * Creates a new logger console for each Lambda invocation to ensure proper isolation.
 * Returns the shared console instance for z.console to use.
 */
const initialize = (input) => {
  // Always create a new logger console for each invocation to ensure
  // log context isolation between Lambda invocations
  loggerConsole = createLoggerConsole(input);
  return loggerConsole;
};

/**
 * Reset the singleton for testing purposes
 */
const reset = () => {
  loggerConsole = null;
};

/**
 * Proxy that behaves like a console object.
 * Forwards calls to loggerConsole if initialized, otherwise to global console.
 */
const consoleProxy = new Proxy(console, {
  get(target, prop, receiver) {
    // Use loggerConsole if initialized, otherwise fall back to global console
    const actualConsole = loggerConsole || target;
    return Reflect.get(actualConsole, prop, actualConsole);
  },
});

module.exports = {
  consoleProxy,
  initialize,
  reset,
};
