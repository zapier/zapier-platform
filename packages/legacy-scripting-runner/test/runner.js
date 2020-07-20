const should = require('should');

const scriptingRunner = require('../index');

describe('scriptingRunner', () => {
  const defaultBundle = {
    _legacyUrl: 'https://zapier.com',
    inputData: {
      user: 'Zapier',
    },
    authData: {
      apiKey: 'Zapier-API-Key',
    },
    meta: {
      frontend: false,
      prefill: false,
    },
  };

  const z = {
    request: () => {},
  };

  it('should return nothing if there is no scripting', (done) => {
    const event = {
      name: 'trigger.poll',
      key: 'trigger',
      response: {
        status: 200,
        content: '[{"id": 1, "name": "Zapier"}]',
      },
    };
    const bundle = defaultBundle;
    const Zap = {};

    const legacyScriptingRunner = scriptingRunner(Zap);

    legacyScriptingRunner
      .runEvent(event, z, bundle)
      .then((result) => {
        should(result).eql(undefined);
        done();
      })
      .catch(done);
  });

  it('should return nothing if there is no event', (done) => {
    const event = {};
    const bundle = defaultBundle;
    const Zap = {
      trigger_poll: () => true,
    };

    const legacyScriptingRunner = scriptingRunner(Zap);

    legacyScriptingRunner
      .runEvent(event, z, bundle)
      .then((result) => {
        should(result).eql(undefined);
        done();
      })
      .catch(done);
  });

  it('should return nothing if there is no event.name', (done) => {
    const event = {
      key: 'trigger',
      response: {
        status: 200,
        content: '[{"id": 1, "name": "Zapier"}]',
      },
    };
    const bundle = defaultBundle;
    const Zap = {
      trigger_poll: () => true,
    };

    const legacyScriptingRunner = scriptingRunner(Zap);

    legacyScriptingRunner
      .runEvent(event, z, bundle)
      .then((result) => {
        should(result).eql(undefined);
        done();
      })
      .catch(done);
  });
});
