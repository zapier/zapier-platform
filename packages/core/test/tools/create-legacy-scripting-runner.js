'use strict';

const Module = require('module');
const should = require('should');

describe('create-legacy-scripting-runner', () => {
  it('should log a warning and return null when the module cannot be loaded', () => {
    const originalRequire = Module.prototype.require;
    const cannotFindModule = new Error(
      "Cannot find module 'zapier-platform-legacy-scripting-runner'",
    );

    Module.prototype.require = function (id) {
      if (
        id === 'zapier-platform-legacy-scripting-runner' ||
        id.startsWith('zapier-platform-legacy-scripting-runner/')
      ) {
        throw cannotFindModule;
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
      warnCalls[0][1].should.equal(cannotFindModule.message);
    } finally {
      Module.prototype.require = originalRequire;
      console.warn = originalWarn;
      delete require.cache[createLegacyScriptingRunnerPath];
      require(createLegacyScriptingRunnerPath);
    }
  });
});
