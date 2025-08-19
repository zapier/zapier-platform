'use strict';

require('should');

const injectZObject = require('../src/app-middlewares/before/z-object');
const { consoleProxy, reset } = require('../src/tools/console-singleton');

describe('z.console and console singleton integration', () => {
  beforeEach(() => {
    // Reset singleton before each test
    reset();
  });

  it('should initialize singleton when z.console is created', () => {
    const logs = [];
    const mockLogger = (message, data) => {
      logs.push({ message, data });
      return Promise.resolve();
    };

    const mockInput = {
      _zapier: {
        logger: mockLogger,
        promises: [],
        event: {
          bundle: {},
        },
      },
    };

    // Run the z-object middleware
    const result = injectZObject(mockInput);

    // Both z.console and singleton should work
    result.z.console.log('test z.console');
    consoleProxy.log('test singleton');

    // Both should have logged messages
    logs.length.should.be.greaterThan(0);
  });

  it('should have both z.console and standalone console working identically', () => {
    const logs = [];
    const mockLogger = (message, data) => {
      logs.push({ message, data });
      return Promise.resolve();
    };

    const mockInput = {
      _zapier: {
        logger: mockLogger,
        promises: [],
        event: {
          bundle: {},
        },
      },
    };

    // Run the z-object middleware
    const result = injectZObject(mockInput);

    // Clear logs
    logs.length = 0;

    // Test both console types with the same message
    result.z.console.log('test message');
    consoleProxy.log('test message');

    // Should have two log entries
    logs.length.should.equal(2);

    // Both should have the same log type
    logs[0].data.log_type.should.equal('console');
    logs[1].data.log_type.should.equal('console');

    // Both should have the same message
    logs[0].message.should.containEql('test message');
    logs[1].message.should.containEql('test message');
  });

  it('should maintain z.console backwards compatibility', () => {
    const logs = [];
    const mockLogger = (message, data) => {
      logs.push({ message, data });
      return Promise.resolve();
    };

    const mockInput = {
      _zapier: {
        logger: mockLogger,
        promises: [],
        event: {
          bundle: {},
        },
      },
    };

    // Run the z-object middleware
    const result = injectZObject(mockInput);

    // z.console should exist and work as before
    result.z.should.have.property('console');
    result.z.console.should.have.property('log');
    result.z.console.should.have.property('error');
    result.z.console.should.have.property('warn');

    // Test that it logs properly
    result.z.console.log('backward compatibility test');
    result.z.console.error('error test');

    // Should have logged messages
    logs.length.should.be.greaterThan(0);

    // Check log types
    const logMessages = logs.map((log) => log.data.log_type);
    logMessages.should.containEql('console');
    logMessages.should.containEql('error');
  });
});
