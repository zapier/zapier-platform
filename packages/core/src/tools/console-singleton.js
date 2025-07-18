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
 * Returns the shared console instance for z.console to use.
 */
const initialize = (input) => {
  if (!loggerConsole) {
    loggerConsole = createLoggerConsole(input);
  }
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
    return actualConsole[prop];
  }
});

module.exports = consoleProxy;
module.exports.initialize = initialize;
module.exports._reset = reset;
