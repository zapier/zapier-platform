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

  it('should create new logger for each initialization to ensure Lambda invocation isolation', () => {
    const logs1 = [];
    const logs2 = [];

    const mockLogger1 = (message, data) => {
      logs1.push({ message, data });
      return Promise.resolve();
    };
    const mockLogger2 = (message, data) => {
      logs2.push({ message, data });
      return Promise.resolve();
    };

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

    // Initialize for first "Lambda invocation"
    initialize(mockInput1);
    consoleProxy.log('message from first invocation');

    // Initialize for second "Lambda invocation"
    initialize(mockInput2);
    consoleProxy.log('message from second invocation');

    // Each invocation should use its own logger
    logs1.length.should.equal(1);
    logs2.length.should.equal(1);

    logs1[0].message.should.containEql('first invocation');
    logs2[0].message.should.containEql('second invocation');
  });

  it('should ensure proper Lambda invocation isolation with different contexts', () => {
    const invocation1Logs = [];
    const invocation2Logs = [];

    const logger1 = (message, data) => {
      invocation1Logs.push({ message, data, context: 'user1_account1' });
      return Promise.resolve();
    };

    const logger2 = (message, data) => {
      invocation2Logs.push({ message, data, context: 'user2_account2' });
      return Promise.resolve();
    };

    const input1 = {
      _zapier: {
        logger: logger1,
        promises: [],
        event: { bundle: { customuser_id: 'user1', account_id: 'account1' } },
      },
    };

    const input2 = {
      _zapier: {
        logger: logger2,
        promises: [],
        event: { bundle: { customuser_id: 'user2', account_id: 'account2' } },
      },
    };

    // Simulate Lambda invocation 1
    initialize(input1);
    consoleProxy.log('Action performed for user1');

    // Simulate Lambda invocation 2 (in same container)
    initialize(input2);
    consoleProxy.log('Action performed for user2');

    // Verify no cross-contamination of logs
    invocation1Logs.length.should.equal(1);
    invocation2Logs.length.should.equal(1);

    // Each logger should only have received its own invocation's logs
    invocation1Logs[0].context.should.equal('user1_account1');
    invocation2Logs[0].context.should.equal('user2_account2');
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
