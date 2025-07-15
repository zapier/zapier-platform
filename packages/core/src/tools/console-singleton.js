'use strict';

const stream = require('stream');
const Console = require('console').Console;

/**
 * Singleton console instance that can be used standalone or initialized by middleware.
 * Before initialization, methods are no-ops. After initialization, they behave like z.console.
 */
class ConsoleSingleton {
  constructor() {
    this._isInitialized = false;
    this._console = null;

    // Create no-op implementations for all Console methods
    this._createNoOpMethods();
  }

  /**
   * Initialize the console with the input context from middleware.
   * This is called by the z-object middleware.
   */
  initialize(input) {
    if (this._isInitialized) {
      return; // Already initialized
    }

    const doWrite = (data, chunk, encoding, next) => {
      const promise = input._zapier.logger(chunk.toString(), data);

      // stash the promise in input, so we can wait on it later
      input._zapier.promises.push(promise);

      next();

      (console[data.log_type] || console.log)(chunk.toString());
    };

    const stdout = new stream.Writable({
      write: doWrite.bind(undefined, { log_type: 'console' }),
    });

    const stderr = new stream.Writable({
      write: doWrite.bind(undefined, { log_type: 'error' }),
    });

    this._console = new Console(stdout, stderr);
    this._isInitialized = true;

    // Replace no-op methods with real console methods
    this._bindConsoleMethods();
  }

  /**
   * Reset the singleton for testing purposes
   */
  _reset() {
    this._isInitialized = false;
    this._console = null;
    this._createNoOpMethods();
  }

  /**
   * Create no-op implementations for all Console methods
   */
  _createNoOpMethods() {
    // Standard console methods that should be no-ops before initialization
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

    consoleMethods.forEach((method) => {
      this[method] = () => {
        // No-op when not initialized
        // We could optionally fall back to regular console here:
        // console[method](...arguments);
      };
    });
  }

  /**
   * Bind the real console methods once initialized
   */
  _bindConsoleMethods() {
    if (!this._console) return;

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

    consoleMethods.forEach((method) => {
      if (typeof this._console[method] === 'function') {
        this[method] = this._console[method].bind(this._console);
      }
    });
  }
}

// Create and export the singleton instance
const consoleSingleton = new ConsoleSingleton();

module.exports = consoleSingleton;
