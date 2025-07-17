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
 * Get the console instance.
 * Returns the logger console if initialized, otherwise the global console as fallback.
 */
const get = () => {
  return loggerConsole || console;
};

module.exports = {
  get,
  initialize,
  _reset: reset,
};
