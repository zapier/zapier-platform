'use strict';

require('should');

const consoleSingleton = require('../../src/tools/console-singleton');

describe('console singleton', () => {
  beforeEach(() => {
    // Reset the singleton before each test
    consoleSingleton._reset();
  });

  it('should return global console before initialization', () => {
    const consoleInstance = consoleSingleton.get();
    consoleInstance.should.equal(console);
  });

  it('should initialize with input and return logger console', () => {
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
    const loggerConsole = consoleSingleton.initialize(mockInput);

    // Check that singleton now returns the logger console
    const consoleInstance = consoleSingleton.get();
    consoleInstance.should.equal(loggerConsole);
    consoleInstance.should.not.equal(console);

    // Test that console methods work
    consoleInstance.log('test message');
    consoleInstance.error('test error');

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
    const firstInstance = consoleSingleton.initialize(mockInput1);
    consoleSingleton.get().should.equal(firstInstance);

    // Try to initialize again with different input
    const secondInstance = consoleSingleton.initialize(mockInput2);

    // Should return the same instance and should use the first logger
    secondInstance.should.equal(firstInstance);
    consoleSingleton.get().should.equal(firstInstance);
  });

  it('should have expected structure', () => {
    consoleSingleton.should.have.property('get');
    consoleSingleton.should.have.property('initialize');
    consoleSingleton.should.have.property('_reset');
    
    consoleSingleton.get.should.be.a.Function();
    consoleSingleton.initialize.should.be.a.Function();
    consoleSingleton._reset.should.be.a.Function();
  });

  describe('when initialized', () => {
    let mockInput;
    let logs;
    let consoleInstance;

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
      consoleInstance = consoleSingleton.get();
    });

    it('should use console log type for log method', () => {
      consoleInstance.log('test log');

      // Find the log entry for our message
      const logEntry = logs.find((log) => log.message.includes('test log'));
      logEntry.should.not.be.undefined();
      logEntry.data.log_type.should.equal('console');
    });

    it('should use error log type for error method', () => {
      consoleInstance.error('test error');

      // Find the log entry for our message
      const logEntry = logs.find((log) => log.message.includes('test error'));
      logEntry.should.not.be.undefined();
      logEntry.data.log_type.should.equal('error');
    });
  });
});
