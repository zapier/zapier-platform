'use strict';

require('should');

describe('console export', () => {
  it('should export console from the main package', () => {
    const zapier = require('../index');

    zapier.should.have.property('console');
    zapier.console.should.be.an.Object();

    // Check that it has console methods
    zapier.console.should.have.property('log');
    zapier.console.should.have.property('error');
    zapier.console.should.have.property('warn');

    zapier.console.log.should.be.a.Function();
    zapier.console.error.should.be.a.Function();
    zapier.console.warn.should.be.a.Function();
  });

  it('should allow destructured import of console', () => {
    const { console } = require('../index');

    console.should.be.an.Object();
    console.should.have.property('log');
    console.should.have.property('error');
    console.should.have.property('warn');

    console.log.should.be.a.Function();
    console.error.should.be.a.Function();
    console.warn.should.be.a.Function();
  });

  it('should work before and after initialization', () => {
    const { console } = require('../index');

    // Reset first to ensure clean state
    console._reset();

    // Before initialization, should be no-ops (shouldn't throw)
    console.log('test before init');
    console.error('test error before init');

    // Should not be initialized yet
    console._isInitialized.should.equal(false);

    // Mock initialization
    const mockLogger = () => Promise.resolve();
    const mockInput = {
      _zapier: {
        logger: mockLogger,
        promises: [],
      },
    };

    console.initialize(mockInput);

    // After initialization, should work
    console._isInitialized.should.equal(true);
    console.log('test after init');
    console.error('test error after init');

    // Clean up for other tests
    console._reset();
  });
});
