'use strict';

require('should');

const consoleSingleton = require('../../src/tools/console-singleton');

describe('console singleton', () => {
  beforeEach(() => {
    // Reset the singleton before each test
    consoleSingleton._reset();
  });

  it('should behave like global console before initialization', () => {
    // Before initialization, console methods should work (forwarding to global console)
    consoleSingleton.should.have.property('log');
    consoleSingleton.should.have.property('error');
    consoleSingleton.should.have.property('warn');
    consoleSingleton.should.have.property('info');
    
    // Should be functions
    consoleSingleton.log.should.be.a.Function();
    consoleSingleton.error.should.be.a.Function();
  });

  it('should initialize with input and use logger console', () => {
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

    // Test that console methods work and use the logger
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
    const firstInstance = consoleSingleton.initialize(mockInput1);

    // Try to initialize again with different input
    const secondInstance = consoleSingleton.initialize(mockInput2);

    // Should return the same instance
    secondInstance.should.equal(firstInstance);
  });

  it('should have expected structure', () => {
    consoleSingleton.should.have.property('initialize');
    consoleSingleton.should.have.property('_reset');
    
    // Should behave like a console object
    consoleSingleton.should.have.property('log');
    consoleSingleton.should.have.property('error');
    consoleSingleton.should.have.property('warn');
    consoleSingleton.should.have.property('info');
    
    consoleSingleton.initialize.should.be.a.Function();
    consoleSingleton._reset.should.be.a.Function();
    consoleSingleton.log.should.be.a.Function();
    consoleSingleton.error.should.be.a.Function();
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
