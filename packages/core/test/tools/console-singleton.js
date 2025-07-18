'use strict';

require('should');

const {
  consoleProxy,
  initialize,
  reset,
} = require('../../src/tools/console-singleton');

describe('console singleton', () => {
  beforeEach(() => {
    // Reset the singleton before each test
    reset();
  });

  it('should behave like global console before initialization', () => {
    // Before initialization, console methods should work (forwarding to global console)
    consoleProxy.should.have.property('log');
    consoleProxy.should.have.property('error');
    consoleProxy.should.have.property('warn');
    consoleProxy.should.have.property('info');

    // Should be functions
    consoleProxy.log.should.be.a.Function();
    consoleProxy.error.should.be.a.Function();
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
    initialize(mockInput);

    // Test that console methods work and use the logger
    consoleProxy.log('test message');
    consoleProxy.error('test error');

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
    const firstInstance = initialize(mockInput1);

    // Try to initialize again with different input
    const secondInstance = initialize(mockInput2);

    // Should return the same instance
    secondInstance.should.equal(firstInstance);
  });

  it('should have expected structure', () => {
    // Should behave like a console object
    consoleProxy.should.have.property('log');
    consoleProxy.should.have.property('error');
    consoleProxy.should.have.property('warn');
    consoleProxy.should.have.property('info');

    consoleProxy.log.should.be.a.Function();
    consoleProxy.error.should.be.a.Function();

    // Initialize and reset should be functions
    initialize.should.be.a.Function();
    reset.should.be.a.Function();
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

      initialize(mockInput);
    });

    it('should use console log type for log method', () => {
      consoleProxy.log('test log');

      // Find the log entry for our message
      const logEntry = logs.find((log) => log.message.includes('test log'));
      logEntry.should.not.be.undefined();
      logEntry.data.log_type.should.equal('console');
    });

    it('should use error log type for error method', () => {
      consoleProxy.error('test error');

      // Find the log entry for our message
      const logEntry = logs.find((log) => log.message.includes('test error'));
      logEntry.should.not.be.undefined();
      logEntry.data.log_type.should.equal('error');
    });
  });
});
