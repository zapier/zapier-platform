'use strict';

require('should');

const consoleSingleton = require('../../src/tools/console-singleton');

describe('console singleton', () => {
  beforeEach(() => {
    // Reset the singleton before each test
    consoleSingleton._reset();
  });

  it('should provide no-op methods before initialization', () => {
    // These should not throw errors and not output anything
    consoleSingleton.log('test message');
    consoleSingleton.error('test error');
    consoleSingleton.warn('test warning');
    consoleSingleton.info('test info');
    consoleSingleton.debug('test debug');
    consoleSingleton.trace('test trace');

    // Check that singleton is not initialized
    consoleSingleton._isInitialized.should.equal(false);
  });

  it('should initialize with input and work like regular console', () => {
    const logs = [];
    const mockLogger = (message, data) => {
      logs.push({ message, data });
      return Promise.resolve();
    };

    const mockInput = {
      _zapier: {
        logger: mockLogger,
        promises: [],
      },
    };

    // Initialize the singleton
    consoleSingleton.initialize(mockInput);

    // Check that singleton is now initialized
    consoleSingleton._isInitialized.should.equal(true);

    // Test that console methods work
    consoleSingleton.log('test message');
    consoleSingleton.error('test error');

    // Verify promises were pushed to input
    mockInput._zapier.promises.length.should.be.greaterThan(0);
  });

  it('should not reinitialize if already initialized', () => {
    const mockLogger1 = () => Promise.resolve();
    const mockLogger2 = () => Promise.resolve();

    const mockInput1 = {
      _zapier: {
        logger: mockLogger1,
        promises: [],
      },
    };

    const mockInput2 = {
      _zapier: {
        logger: mockLogger2,
        promises: [],
      },
    };

    // Initialize the singleton
    consoleSingleton.initialize(mockInput1);
    consoleSingleton._isInitialized.should.equal(true);

    // Try to initialize again with different input
    consoleSingleton.initialize(mockInput2);

    // Should still be initialized and should use the first logger
    consoleSingleton._isInitialized.should.equal(true);
  });

  it('should have all expected console methods', () => {
    const expectedMethods = [
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

    expectedMethods.forEach((method) => {
      consoleSingleton.should.have.property(method);
      consoleSingleton[method].should.be.a.Function();
    });
  });

  describe('when initialized', () => {
    let mockInput;
    let logs;

    beforeEach(() => {
      logs = [];
      const mockLogger = (message, data) => {
        logs.push({ message, data });
        return Promise.resolve();
      };

      mockInput = {
        _zapier: {
          logger: mockLogger,
          promises: [],
        },
      };

      consoleSingleton.initialize(mockInput);
    });

    it('should use console log type for log method', () => {
      consoleSingleton.log('test log');

      // Find the log entry for our message
      const logEntry = logs.find((log) => log.message.includes('test log'));
      logEntry.should.not.be.undefined();
      logEntry.data.log_type.should.equal('console');
    });

    it('should use error log type for error method', () => {
      consoleSingleton.error('test error');

      // Find the log entry for our message
      const logEntry = logs.find((log) => log.message.includes('test error'));
      logEntry.should.not.be.undefined();
      logEntry.data.log_type.should.equal('error');
    });
  });
});
