'use strict';

require('should');

const { reset } = require('../src/tools/console-singleton');

describe('console export', () => {
  beforeEach(() => {
    // Reset singleton before each test
    reset();
  });

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
    const { initialize } = require('../src/tools/console-singleton');

    // Before initialization, should forward to global console (shouldn't throw)
    console.log('test before init');
    console.error('test error before init');

    // Mock initialization
    const mockLogger = () => Promise.resolve();
    const mockInput = {
      _zapier: {
        logger: mockLogger,
        promises: [],
      },
    };

    initialize(mockInput);

    // After initialization, should work with logger console
    console.log('test after init');
    console.error('test error after init');
  });
});
