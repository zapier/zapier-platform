'use strict';

const _ = require('lodash');
const should = require('should');

const apiKeyAuth = require('./example-app/api-key-auth');
const appDefinition = require('./example-app');
const oauth2Config = require('./example-app/oauth2');
const sessionAuthConfig = require('./example-app/session-auth');
const createApp = require('zapier-platform-core/src/create-app');
const createInput = require('zapier-platform-core/src/tools/create-input');
const schemaTools = require('zapier-platform-core/src/tools/schema');

const withAuth = (appDef, authConfig) => {
  return _.extend(_.cloneDeep(appDef), _.cloneDeep(authConfig));
};

describe('Integration Test', () => {
  const testLogger = (/* message, data */) => {
    // console.log(message, data);
    return Promise.resolve({});
  };

  const createTestInput = (compiledApp, method) => {
    const event = {
      bundle: {},
      method
    };
    return createInput(compiledApp, event, testLogger);
  };

  describe('session auth', () => {
    const appDefWithAuth = withAuth(appDefinition, sessionAuthConfig);
    const compiledApp = schemaTools.prepareApp(appDefWithAuth);
    const app = createApp(appDefWithAuth);

    it('get_session_info', () => {
      const input = createTestInput(
        compiledApp,
        'authentication.sessionConfig.perform'
      );
      input.bundle.authData = {
        username: 'user',
        password: 'secret'
      };
      return app(input).then(output => {
        should.equal(output.results.key1, 'sec');
        should.equal(output.results.key2, 'ret');
      });
    });

    it('get_connection_label', () => {
      const input = createTestInput(
        compiledApp,
        'authentication.connectionLabel'
      );
      input.bundle.inputData = {
        name: 'Mark'
      };
      return app(input).then(output => {
        should.equal(output.results, 'Hi Mark');
      });
    });
  });

  describe('oauth2', () => {
    let origEnv;

    beforeEach(() => {
      origEnv = process.env;
      process.env = {
        CLIENT_ID: '1234',
        CLIENT_SECRET: 'asdf'
      };
    });

    afterEach(() => {
      process.env = origEnv;
    });

    it('pre_oauthv2_token', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      appDefWithAuth.legacyScriptingSource = appDefWithAuth.legacyScriptingSource.replace(
        'post_oauthv2_token',
        'dont_care'
      );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.getAccessToken'
      );
      input.bundle.inputData = {
        redirect_uri: 'https://example.com',
        code: 'one_time_code'
      };
      return app(input).then(output => {
        should.equal(output.results.access_token, 'a_token');
        should.equal(output.results.something_custom, 'alright!');
        should.not.exist(output.results.name);
      });
    });

    it('post_oauthv2_token', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      appDefWithAuth.legacyScriptingSource = appDefWithAuth.legacyScriptingSource.replace(
        'pre_oauthv2_token',
        'dont_care'
      );
      appDefWithAuth.authentication.oauth2Config.legacyProperties.accessTokenUrl +=
        'token';
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.getAccessToken'
      );
      input.bundle.inputData = {
        redirect_uri: 'https://example.com',
        code: 'one_time_code'
      };
      return app(input).then(output => {
        should.equal(output.results.access_token, 'a_token');
        should.equal(output.results.something_custom, 'alright!!!');
        should.equal(output.results.name, 'Jane Doe');
      });
    });

    it('pre_oauthv2_token & post_oauthv2_token', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.getAccessToken'
      );
      input.bundle.inputData = {
        redirect_uri: 'https://example.com',
        code: 'one_time_code'
      };
      return app(input).then(output => {
        should.equal(output.results.access_token, 'a_token');
        should.equal(output.results.something_custom, 'alright!!!');
        should.equal(output.results.name, 'Jane Doe');
      });
    });

    it('pre_oauthv2_refresh', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.refreshAccessToken'
      );
      input.bundle.authData = {
        refresh_token: 'a_refresh_token'
      };
      return app(input).then(output => {
        should.equal(output.results.access_token, 'a_new_token');
      });
    });
  });

  describe('trigger', () => {
    const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
    const compiledApp = schemaTools.prepareApp(appDefWithAuth);
    const app = createApp(appDefWithAuth);

    it('KEY_poll', () => {
      const input = createTestInput(
        compiledApp,
        'triggers.contact_full.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        output.results.length.should.greaterThan(1);

        const firstContact = output.results[0];
        should.equal(firstContact.name, 'Patched by KEY_poll!');
      });
    });

    it('KEY_pre_poll', () => {
      const input = createTestInput(
        compiledApp,
        'triggers.contact_pre.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        output.results.length.should.equal(1);

        const contact = output.results[0];
        should.equal(contact.id, 3);
      });
    });

    it('KEY_post_poll', () => {
      const input = createTestInput(
        compiledApp,
        'triggers.contact_post.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        output.results.length.should.greaterThan(1);

        const firstContact = output.results[0];
        should.equal(firstContact.name, 'Patched by KEY_post_poll!');
      });
    });

    it('KEY_pre_poll & KEY_post_poll', () => {
      const input = createTestInput(
        compiledApp,
        'triggers.contact_pre_post.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        output.results.length.should.equal(1);

        const contact = output.results[0];
        should.equal(contact.id, 4);
        should.equal(contact.name, 'Patched by KEY_pre_poll & KEY_post_poll!');
      });
    });

    it("auth test shouldn't require array result", () => {
      const input = createTestInput(
        compiledApp,
        'triggers.test.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.meta = { test_poll: true };
      return app(input).then(output => {
        should.equal(output.results.length, 1);

        const user = output.results[0];
        should.equal(user.id, 1);
        should.equal(user.username, 'Bret');
      });
    });

    it('scriptingless hook', () => {
      const input = createTestInput(
        appDefinition,
        'triggers.contact_hook_scriptingless.operation.perform'
      );
      input.bundle.cleanedRequest = {
        id: 9,
        name: 'Amy'
      };
      return app(input).then(output => {
        output.results.length.should.equal(1);
        const contact = output.results[0];
        should.deepEqual(contact, {
          id: 9,
          name: 'Amy'
        });
      });
    });

    it('KEY_catch_hook returns an object', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacyScriptingSource = appDef.legacyScriptingSource.replace(
        'contact_hook_scripting_catch_hook_returning_object',
        'contact_hook_scripting_catch_hook'
      );

      const input = createTestInput(
        appDef,
        'triggers.contact_hook_scripting.operation.perform'
      );
      input.bundle.cleanedRequest = {
        id: 10,
        name: 'Bob'
      };
      return app(input).then(output => {
        output.results.length.should.equal(1);
        const contact = output.results[0];
        should.deepEqual(contact, {
          id: 10,
          name: 'Bob',
          luckyNumber: 777
        });
      });
    });

    it('KEY_catch_hook returns an array', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacyScriptingSource = appDef.legacyScriptingSource.replace(
        'contact_hook_scripting_catch_hook_returning_array',
        'contact_hook_scripting_catch_hook'
      );

      const input = createTestInput(
        appDef,
        'triggers.contact_hook_scripting.operation.perform'
      );
      input.bundle.cleanedRequest = [
        { id: 11, name: 'Cate' },
        { id: 22, name: 'Dave' }
      ];
      return app(input).then(output => {
        output.results.should.deepEqual([
          { id: 11, name: 'Cate', luckyNumber: 110 },
          { id: 22, name: 'Dave', luckyNumber: 220 }
        ]);
      });
    });

    it('pre_subscribe & post_subscribe', () => {
      const input = createTestInput(
        compiledApp,
        'triggers.contact_hook_scripting.operation.performSubscribe'
      );
      input.bundle.authData = { api_key: 'hey hey' };
      return app(input).then(output => {
        should.equal(output.results.json.event, 'contact.created');
        should.equal(
          output.results.json.hidden_message,
          'pre_subscribe was here!'
        );
        should.equal(output.results.headers['X-Api-Key'], 'hey hey');
        should.equal(output.results.hiddenMessage, 'post_subscribe was here!');
      });
    });

    it('pre_unsubscribe', () => {
      const input = createTestInput(
        compiledApp,
        'triggers.contact_hook_scripting.operation.performUnsubscribe'
      );
      input.bundle.authData = { api_key: 'yo yo' };
      return app(input).then(output => {
        should.equal(output.results.request.method, 'DELETE');

        const echoed = output.results.json;
        should.equal(echoed.json.event, 'contact.created');
        should.equal(echoed.json.hidden_message, 'pre_unsubscribe was here!');
        should.equal(echoed.headers['X-Api-Key'], 'yo yo');
      });
    });
  });
});
