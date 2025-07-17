'use strict';

const createLoggerConsole = require('./create-logger-console');

/**
 * Shared console instance that can be used standalone or as z.console.
 * Uses createLoggerConsole to create the single instance shared between both.
 */

// Shared console instance - will be initialized by middleware
let sharedConsoleInstance = null;

/**
 * Initialize the console with the input context from middleware.
 * This is called by the z-object middleware and uses createLoggerConsole.
 * Returns the shared console instance for z.console to use.
 */
const initialize = (input) => {
  if (!sharedConsoleInstance) {
    sharedConsoleInstance = createLoggerConsole(input);
  }
  return sharedConsoleInstance;
};

/**
 * Reset the singleton for testing purposes
 */
const reset = () => {
  sharedConsoleInstance = null;
};

// Standard console methods that forward to the shared instance or no-op
const consoleMethods = [
  'log',
  'warn',
  'error',
  'info',
  'debug',
  'trace',
  'dir',
  'dirxml',
  'table',
  'time',
  'timeEnd',
  'timeLog',
  'assert',
  'clear',
  'count',
  'countReset',
  'group',
  'groupEnd',
  'groupCollapsed',
];

// Create the exported console object that forwards to shared instance
const exportedConsole = {};

// Add _isInitialized property that checks if shared instance exists
Object.defineProperty(exportedConsole, '_isInitialized', {
  get: () => Boolean(sharedConsoleInstance),
  configurable: true,
});

consoleMethods.forEach((method) => {
  exportedConsole[method] = (...args) => {
    if (
      sharedConsoleInstance &&
      typeof sharedConsoleInstance[method] === 'function'
    ) {
      return sharedConsoleInstance[method](...args);
    }
    // No-op when not initialized
  };
});

// Expose initialize and reset methods for middleware and tests
exportedConsole.initialize = initialize;
exportedConsole._reset = reset;

module.exports = exportedConsole;
