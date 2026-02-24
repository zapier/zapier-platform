'use strict';

const Module = require('module');
const should = require('should');

describe('create-legacy-scripting-runner', () => {
  it('should not warn when legacy-scripting-runner is not installed (CLI-native app)', () => {
    const originalRequire = Module.prototype.require;
    const moduleNotFoundError = new Error(
      "Cannot find module 'zapier-platform-legacy-scripting-runner'",
    );
    moduleNotFoundError.code = 'MODULE_NOT_FOUND';

    Module.prototype.require = function (id) {
      if (
        id === 'zapier-platform-legacy-scripting-runner' ||
        id.startsWith('zapier-platform-legacy-scripting-runner/')
      ) {
        throw moduleNotFoundError;
      }
      return originalRequire.apply(this, arguments);
    };

    const createLegacyScriptingRunnerPath = require.resolve(
      '../../src/tools/create-legacy-scripting-runner',
    );
    delete require.cache[createLegacyScriptingRunnerPath];
    const createLegacyScriptingRunner = require('../../src/tools/create-legacy-scripting-runner');

    const warnCalls = [];
    const originalWarn = console.warn;
    console.warn = (...args) => {
      warnCalls.push(args);
    };

    try {
      const z = {};
      const input = {
        _zapier: {
          app: {
            legacyScriptingSource: 'var Zap = {};',
          },
        },
      };

      const result = createLegacyScriptingRunner(z, input);

      should(result).equal(null);
      warnCalls.length.should.equal(0);
    } finally {
      Module.prototype.require = originalRequire;
      console.warn = originalWarn;
      delete require.cache[createLegacyScriptingRunnerPath];
      require(createLegacyScriptingRunnerPath);
    }
  });

  it('should log a warning and return null when the package is installed but fails to load', () => {
    const originalRequire = Module.prototype.require;
    const loadError = new Error("Cannot find module 'form-data'");
    loadError.code = 'MODULE_NOT_FOUND';

    Module.prototype.require = function (id) {
      if (
        id === 'zapier-platform-legacy-scripting-runner' ||
        id.startsWith('zapier-platform-legacy-scripting-runner/')
      ) {
        throw loadError;
      }
      return originalRequire.apply(this, arguments);
    };

    const createLegacyScriptingRunnerPath = require.resolve(
      '../../src/tools/create-legacy-scripting-runner',
    );
    delete require.cache[createLegacyScriptingRunnerPath];
    const createLegacyScriptingRunner = require('../../src/tools/create-legacy-scripting-runner');

    const warnCalls = [];
    const originalWarn = console.warn;
    console.warn = (...args) => {
      warnCalls.push(args);
    };

    try {
      const z = {};
      const input = {
        _zapier: {
          app: {
            legacyScriptingSource: 'var Zap = {};',
          },
        },
      };

      const result = createLegacyScriptingRunner(z, input);

      should(result).equal(null);
      warnCalls.length.should.equal(1);
      warnCalls[0][0].should.containEql(
        'Failed to load zapier-platform-legacy-scripting-runner',
      );
      warnCalls[0][0].should.containEql('Error details:');
      warnCalls[0][1].should.equal(loadError.message);
    } finally {
      Module.prototype.require = originalRequire;
      console.warn = originalWarn;
      delete require.cache[createLegacyScriptingRunnerPath];
      require(createLegacyScriptingRunnerPath);
    }
  });
});
