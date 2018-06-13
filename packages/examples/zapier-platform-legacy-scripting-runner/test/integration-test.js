'use strict';

const _ = require('lodash');
const should = require('should');

const appDefinition = require('./example-app');
const sessionAuthConfig = require('./example-app/session-auth');
const createApp = require('zapier-platform-core/src/create-app');
const createInput = require('zapier-platform-core/src/tools/create-input');

const withAuth = (appDef, authConfig) => {
  return _.extend(_.cloneDeep(appDef), authConfig);
};

// TODO: This is currently failing. Remove .skip once core 6.2.0 is released.
describe.skip('Integration Test', () => {
  const testLogger = (/* message, data */) => {
    // console.log(message, data);
    return Promise.resolve({});
  };

  const createTestInput = method => {
    const event = {
      bundle: {},
      method
    };

    return createInput(appDefinition, event, testLogger);
  };

  describe('auth.session', () => {
    const appDefWithAuth = withAuth(appDefinition, sessionAuthConfig);
    const app = createApp(appDefWithAuth);

    it('get_session_info', () => {
      const input = createTestInput('authentication.sessionConfig.perform');
      input.bundle.authData = {
        username: 'user',
        password: 'secret'
      };
      return app(input).then(output => {
        should.equal(output.results.key1, 'sec');
        should.equal(output.results.key2, 'ret');
      });
    });
  });

  describe('trigger', () => {
    const app = createApp(appDefinition);

    it('KEY_poll', () => {
      const input = createTestInput('triggers.contact_full.operation.perform');
      return app(input).then(output => {
        output.results.length.should.greaterThan(1);

        const firstContact = output.results[0];
        should.equal(firstContact.name, 'Patched by KEY_poll!');
      });
    });

    it('KEY_pre_poll', () => {
      const input = createTestInput('triggers.contact_pre.operation.perform');
      return app(input).then(output => {
        output.results.length.should.equal(1);

        const contact = output.results[0];
        should.equal(contact.id, 3);
      });
    });

    it('KEY_post_poll', () => {
      const input = createTestInput('triggers.contact_post.operation.perform');
      return app(input).then(output => {
        output.results.length.should.greaterThan(1);

        const firstContact = output.results[0];
        should.equal(firstContact.name, 'Patched by KEY_post_poll!');
      });
    });

    it('KEY_pre_poll & KEY_post_poll', () => {
      const input = createTestInput(
        'triggers.contact_pre_post.operation.perform'
      );
      return app(input).then(output => {
        output.results.length.should.equal(1);

        const contact = output.results[0];
        should.equal(contact.id, 4);
        should.equal(contact.name, 'Patched by KEY_pre_poll & KEY_post_poll!');
      });
    });
  });
});
