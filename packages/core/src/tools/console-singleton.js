'use strict';

const createLoggerConsole = require('./create-logger-console');

/**
 * Singleton console instance that can be used standalone or initialized by middleware.
 * Before initialization, methods are no-ops. After initialization, they behave like z.console.
 * Uses the same createLoggerConsole function as z.console for consistency.
 */

// Shared console instance - will be initialized by middleware
let sharedConsoleInstance = null;
let isInitialized = false;

// Standard console methods that should be available
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

// Create the singleton console object
const consoleSingleton = {};

// Add backward compatibility property for tests
Object.defineProperty(consoleSingleton, '_isInitialized', {
  get: () => isInitialized,
  configurable: true
});

// Initialize with no-op methods
consoleMethods.forEach((method) => {
  consoleSingleton[method] = () => {
    // No-op when not initialized
    // We could optionally fall back to regular console here:
    // console[method](...arguments);
  };
});

/**
 * Initialize the console with the input context from middleware.
 * This is called by the z-object middleware and uses createLoggerConsole.
 */
consoleSingleton.initialize = (input) => {
  if (isInitialized) {
    return sharedConsoleInstance; // Already initialized, return existing instance
  }

  // Create the logger console using the existing function
  sharedConsoleInstance = createLoggerConsole(input);
  isInitialized = true;

  // Replace no-op methods with real console methods
  consoleMethods.forEach((method) => {
    if (typeof sharedConsoleInstance[method] === 'function') {
      consoleSingleton[method] = sharedConsoleInstance[method].bind(sharedConsoleInstance);
    }
  });

  return sharedConsoleInstance;
};

/**
 * Get the shared console instance (for z.console to use the same instance)
 */
consoleSingleton.getSharedInstance = () => {
  return sharedConsoleInstance;
};

/**
 * Reset the singleton for testing purposes
 */
consoleSingleton._reset = () => {
  isInitialized = false;
  sharedConsoleInstance = null;
  
  // Reset to no-op methods
  consoleMethods.forEach((method) => {
    consoleSingleton[method] = () => {
      // No-op when not initialized
    };
  });
};

module.exports = consoleSingleton;
