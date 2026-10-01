'use strict';

const should = require('should');

const { loadLegacyZap } = require('../../src/auth-template/legacy-scripting');

describe('loadLegacyZap', () => {
  it('returns null when the app has no scriptingSource', () => {
    should(loadLegacyZap({})).equal(null);
    should(loadLegacyZap({ legacy: {} })).equal(null);
  });

  it('loads a Zap object from a plain scriptingSource', () => {
    const compiledApp = {
      legacy: {
        scriptingSource: `
          var Zap = {
            foo_pre_poll: function (bundle) { return {}; },
          };
        `,
      },
    };

    const Zap = loadLegacyZap(compiledApp);
    should(Zap).have.property('foo_pre_poll');
  });

  it('loads a Zap object whose scriptingSource has a top-level require', () => {
    // Mirrors a real integration whose scriptingSource does
    // `var qs = require('querystring');` at the top level, used inside a
    // pre method that isn't the one this test calls.
    const compiledApp = {
      legacy: {
        scriptingSource: `
          var qs = require('querystring');

          var Zap = {
            foo_pre_poll: function (bundle) { return {}; },
            bar_pre_poll: function (bundle) {
              return { query: qs.stringify({ a: 1 }) };
            },
          };
        `,
      },
    };

    const Zap = loadLegacyZap(compiledApp);
    should(Zap).have.property('foo_pre_poll');
    should(Zap).have.property('bar_pre_poll');
  });

  it('returns null when scriptingSource references an undefined global', () => {
    const compiledApp = {
      legacy: {
        scriptingSource: `
          var helper = someUndefinedGlobal.doThing();

          var Zap = {
            foo_pre_poll: function (bundle) { return {}; },
          };
        `,
      },
    };

    should(loadLegacyZap(compiledApp)).equal(null);
  });

  it('loads a Zap object whose scriptingSource uses crypto at the top level', () => {
    const compiledApp = {
      legacy: {
        scriptingSource: `
          var hash = crypto.createHash('sha256').update('a').digest('hex');

          var Zap = {
            foo_pre_poll: function (bundle) { return { hash: hash }; },
          };
        `,
      },
    };

    const Zap = loadLegacyZap(compiledApp);
    should(Zap).have.property('foo_pre_poll');
  });

  it('loads a Zap object whose scriptingSource uses atob/btoa at the top level', () => {
    const compiledApp = {
      legacy: {
        scriptingSource: `
          var decoded = atob(btoa('hello'));

          var Zap = {
            foo_pre_poll: function (bundle) { return { decoded: decoded }; },
          };
        `,
      },
    };

    const Zap = loadLegacyZap(compiledApp);
    should(Zap).have.property('foo_pre_poll');
  });

  it('loads a Zap object whose scriptingSource references a legacy exception class at the top level', () => {
    const compiledApp = {
      legacy: {
        scriptingSource: `
          var CustomHalted = HaltedException;

          var Zap = {
            foo_pre_poll: function (bundle) { return {}; },
          };
        `,
      },
    };

    const Zap = loadLegacyZap(compiledApp);
    should(Zap).have.property('foo_pre_poll');
  });

  it('loads a Zap object whose scriptingSource hashes something via z at the top level', () => {
    const compiledApp = {
      legacy: {
        scriptingSource: `
          var signature = z.hash('sha256', 'a-shared-secret');

          var Zap = {
            foo_pre_poll: function (bundle) { return { signature: signature }; },
          };
        `,
      },
    };

    const Zap = loadLegacyZap(compiledApp);
    should(Zap).have.property('foo_pre_poll');
  });
});
