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

  describe('polling trigger', () => {
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

    it('KEY_pre_custom_trigger_fields', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacyScriptingSource = appDef.legacyScriptingSource.replace(
        'contact_full_post_custom_trigger_fields',
        'contact_full_post_custom_trigger_fields_disabled'
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.contact_full.operation.outputFields'
      );
      input.bundle.authData = { api_key: 'secret' };
      return _app(input).then(output => {
        const fields = output.results;
        should.equal(fields.length, 5);
        should.equal(fields[0].key, 'id');
        should.equal(fields[1].key, 'name');
        should.equal(fields[2].key, 'id');
        should.equal(fields[3].key, 'color');
        should.equal(fields[4].key, 'age');
      });
    });

    it('KEY_post_custom_trigger_fields', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.triggers.contact_full.operation.legacyProperties.outputFieldsUrl +=
        's';
      appDef.legacyScriptingSource = appDef.legacyScriptingSource.replace(
        'contact_full_pre_custom_trigger_fields',
        'contact_full_pre_custom_trigger_fields_disabled'
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.contact_full.operation.outputFields'
      );
      input.bundle.authData = { api_key: 'secret' };
      return _app(input).then(output => {
        const fields = output.results;
        should.equal(fields.length, 6);
        should.equal(fields[0].key, 'id');
        should.equal(fields[1].key, 'name');
        should.equal(fields[2].key, 'id');
        should.equal(fields[3].key, 'color');
        should.equal(fields[4].key, 'age');
        should.equal(fields[5].key, 'spin');
      });
    });

    it('KEY_pre_custom_trigger_fields & KEY_post_custom_trigger_fields', () => {
      const input = createTestInput(
        compiledApp,
        'triggers.contact_full.operation.outputFields'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        const fields = output.results;
        should.equal(fields.length, 6);
        should.equal(fields[0].key, 'id');
        should.equal(fields[1].key, 'name');
        should.equal(fields[2].key, 'id');
        should.equal(fields[3].key, 'color');
        should.equal(fields[4].key, 'age');
        should.equal(fields[5].key, 'spin');
      });
    });
  });

  describe('hook trigger', () => {
    it('scriptingless', () => {
      const app = createApp(appDefinition);
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

    it('KEY_catch_hook => object', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacyScriptingSource = appDef.legacyScriptingSource.replace(
        'contact_hook_scripting_catch_hook_returning_object',
        'contact_hook_scripting_catch_hook'
      );
      const app = createApp(appDef);
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
        should.equal(contact.id, 10);
        should.equal(contact.name, 'Bob');
        should.equal(contact.luckyNumber, 777);
      });
    });

    it('KEY_catch_hook => array', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacyScriptingSource = appDef.legacyScriptingSource.replace(
        'contact_hook_scripting_catch_hook_returning_array',
        'contact_hook_scripting_catch_hook'
      );
      const app = createApp(appDef);
      const input = createTestInput(
        appDef,
        'triggers.contact_hook_scripting.operation.perform'
      );
      input.bundle.cleanedRequest = [
        { id: 11, name: 'Cate' },
        { id: 22, name: 'Dave' }
      ];
      return app(input).then(output => {
        const contacts = output.results;
        should.equal(contacts.length, 2);
        should.equal(contacts[0].id, 11);
        should.equal(contacts[0].name, 'Cate');
        should.equal(contacts[0].luckyNumber, 110);
        should.equal(contacts[1].id, 22);
        should.equal(contacts[1].name, 'Dave');
        should.equal(contacts[1].luckyNumber, 220);
      });
    });

    it('REST Hook should ignore KEY_pre_hook', () => {
      // Not a Notication REST hook, KEY_pre_hook should be ignored
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacyScriptingSource = appDef.legacyScriptingSource.replace(
        'contact_hook_scripting_catch_hook_returning_object',
        'contact_hook_scripting_catch_hook'
      );
      appDef.legacyScriptingSource = appDef.legacyScriptingSource.replace(
        'contact_hook_scripting_pre_hook_disabled',
        'contact_hook_scripting_pre_hook'
      );
      const appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'triggers.contact_hook_scripting.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.cleanedRequest = {
        id: 3,
        name: 'Eric',
        resource_url: 'https://dont.care'
      };
      return app(input).then(output => {
        output.results.length.should.equal(1);

        const contact = output.results[0];
        should.equal(contact.id, 3);
        should.equal(contact.name, 'Eric');
        should.equal(contact.luckyNumber, 777);
      });
    });

    it('Notification REST Hook w/o resource_url should ignore KEY_pre_hook', () => {
      // Notication REST hook should fall back what REST Hook does when the
      // hook doesn't have resource_url
      const appDef = _.cloneDeep(appDefinition);
      appDef.triggers.contact_hook_scripting.operation.legacyProperties.hookType =
        'notification';
      appDef.legacyScriptingSource = appDef.legacyScriptingSource.replace(
        'contact_hook_scripting_catch_hook_returning_object',
        'contact_hook_scripting_catch_hook'
      );
      appDef.legacyScriptingSource = appDef.legacyScriptingSource.replace(
        'contact_hook_scripting_pre_hook_disabled',
        'contact_hook_scripting_pre_hook'
      );
      const appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'triggers.contact_hook_scripting.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.cleanedRequest = {
        id: 3,
        name: 'Eric'
      };
      return app(input).then(output => {
        output.results.length.should.equal(1);

        const contact = output.results[0];
        should.equal(contact.id, 3);
        should.equal(contact.name, 'Eric');
        should.equal(contact.luckyNumber, 777);
      });
    });

    it('KEY_pre_hook', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.triggers.contact_hook_scripting.operation.legacyProperties.hookType =
        'notification';
      appDef.legacyScriptingSource = appDef.legacyScriptingSource.replace(
        'contact_hook_scripting_pre_hook_disabled',
        'contact_hook_scripting_pre_hook'
      );
      const appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'triggers.contact_hook_scripting.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.cleanedRequest = {
        id: 3,
        name: 'Dont Care',
        resource_url: 'https://auth-json-server.zapier.ninja/users/3'
      };
      return app(input).then(output => {
        output.results.length.should.equal(1);

        const movie = output.results[0];
        should.equal(movie.id, 3);
        should.equal(movie.title, 'title 3');
      });
    });

    it('KEY_post_hook => object', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.triggers.contact_hook_scripting.operation.legacyProperties.hookType =
        'notification';
      appDef.legacyScriptingSource = appDef.legacyScriptingSource.replace(
        'contact_hook_scripting_post_hook_returning_object',
        'contact_hook_scripting_post_hook'
      );
      const appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'triggers.contact_hook_scripting.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.cleanedRequest = {
        id: 3,
        name: 'Dont Care',
        resource_url: 'https://auth-json-server.zapier.ninja/users/3'
      };
      return app(input).then(output => {
        output.results.length.should.equal(1);

        const contact = output.results[0];
        should.equal(contact.id, 3);
        should.equal(contact.name, 'Clementine Bauch');
        should.equal(contact.year, 2018);
      });
    });

    it('KEY_post_hook => array', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.triggers.contact_hook_scripting.operation.legacyProperties.hookType =
        'notification';
      appDef.legacyScriptingSource = appDef.legacyScriptingSource.replace(
        'contact_hook_scripting_post_hook_returning_array',
        'contact_hook_scripting_post_hook'
      );
      const appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'triggers.contact_hook_scripting.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.cleanedRequest = {
        id: 3,
        name: 'Dont Care',
        resource_url: 'https://auth-json-server.zapier.ninja/users/3'
      };
      return app(input).then(output => {
        const things = output.results;
        should.equal(things.length, 2);
        should.equal(things[0].id, 3);
        should.equal(things[0].name, 'Clementine Bauch');
        should.equal(things[0].year, 2017);
        should.equal(things[1].id, 5555);
        should.equal(things[1].name, 'The Thing');
        should.equal(things[1].year, 2016);
      });
    });

    it('KEY_pre_hook & KEY_post_hook => object', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.triggers.contact_hook_scripting.operation.legacyProperties.hookType =
        'notification';
      appDef.legacyScriptingSource = appDef.legacyScriptingSource.replace(
        'contact_hook_scripting_pre_hook_disabled',
        'contact_hook_scripting_pre_hook'
      );
      appDef.legacyScriptingSource = appDef.legacyScriptingSource.replace(
        'contact_hook_scripting_post_hook_returning_object',
        'contact_hook_scripting_post_hook'
      );
      const appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'triggers.contact_hook_scripting.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.cleanedRequest = {
        id: 3,
        name: 'Dont Care',
        resource_url: 'https://auth-json-server.zapier.ninja/users/3'
      };
      return app(input).then(output => {
        output.results.length.should.equal(1);

        const movie = output.results[0];
        should.equal(movie.id, 3);
        should.equal(movie.title, 'title 3');
        should.equal(movie.year, 2018);
      });
    });

    it('pre_subscribe & post_subscribe', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

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
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

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

  describe('create', () => {
    it('scriptingless perform', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.creates.movie.operation.legacyProperties.url += 's';

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'It',
        genre: 'Horror'
      };
      return app(input).then(output => {
        const movie = output.results;
        should.exist(movie.id);
        should.not.exist(movie.title);
        should.equal(movie.genre, 'Horror');
      });
    });

    it('KEY_pre_write', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacyScriptingSource = appDefWithAuth.legacyScriptingSource.replace(
        'movie_pre_write_disabled',
        'movie_pre_write'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'The Shape of Water',
        genre: 'Fantasy'
      };
      return app(input).then(output => {
        const movie = output.results;
        should.exist(movie.id);
        should.equal(movie.title, 'The Shape of Water');
        should.equal(movie.genre, 'Fantasy');
      });
    });

    it('KEY_post_write', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.creates.movie.operation.legacyProperties.url += 's';
      appDefWithAuth.legacyScriptingSource = appDefWithAuth.legacyScriptingSource.replace(
        'movie_post_write_disabled',
        'movie_post_write'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'Get Out',
        genre: 'Comedy'
      };
      return app(input).then(output => {
        const movie = output.results;
        should.exist(movie.id);
        should.not.exist(movie.title);
        should.equal(movie.genre, 'Comedy');
        should.equal(movie.year, 2017);
      });
    });

    it('KEY_pre_write & KEY_post_write', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacyScriptingSource = appDefWithAuth.legacyScriptingSource.replace(
        'movie_pre_write_disabled',
        'movie_pre_write'
      );
      appDefWithAuth.legacyScriptingSource = appDefWithAuth.legacyScriptingSource.replace(
        'movie_post_write_disabled',
        'movie_post_write'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'Phantom Thread',
        genre: 'Drama'
      };
      return app(input).then(output => {
        const movie = output.results;
        should.exist(movie.id);
        should.equal(movie.title, 'Phantom Thread');
        should.equal(movie.genre, 'Drama');
        should.equal(movie.year, 2017);
      });
    });

    it('async KEY_write', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacyScriptingSource = appDefWithAuth.legacyScriptingSource.replace(
        'movie_write_async',
        'movie_write'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'Room',
        genre: 'Drama'
      };
      return app(input).then(output => {
        const movie = output.results;
        should.exist(movie.id);
        should.equal(movie.title, 'Room');
        should.equal(movie.genre, 'Drama');
        should.equal(movie.year, 2015);
      });
    });

    it('sync KEY_write', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacyScriptingSource = appDefWithAuth.legacyScriptingSource.replace(
        'movie_write_sync',
        'movie_write'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'Arrival',
        genre: 'Sci-fi'
      };
      return app(input).then(output => {
        const movie = output.results;
        should.exist(movie.id);
        should.equal(movie.title, 'Arrival');
        should.equal(movie.genre, 'Sci-fi');
        should.equal(movie.year, 2016);
      });
    });

    it('scriptingless input fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.creates.movie.operation.legacyProperties.inputFieldsUrl +=
        's';

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.inputFields'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        const fields = output.results;
        should.equal(fields.length, 3);
        should.equal(fields[0].key, 'title');
        should.equal(fields[1].key, 'genre');
        should.equal(fields[2].key, 'luckyNumber');
      });
    });

    it('KEY_pre_custom_action_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacyScriptingSource = appDefWithAuth.legacyScriptingSource.replace(
        'movie_pre_custom_action_fields_disabled',
        'movie_pre_custom_action_fields'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.inputFields'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        const fields = output.results;
        should.equal(fields.length, 3);
        should.equal(fields[0].key, 'title');
        should.equal(fields[1].key, 'genre');
        should.equal(fields[2].key, 'luckyNumber');
      });
    });

    it('KEY_post_custom_action_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.creates.movie.operation.legacyProperties.inputFieldsUrl +=
        's';
      appDefWithAuth.legacyScriptingSource = appDefWithAuth.legacyScriptingSource.replace(
        'movie_post_custom_action_fields_disabled',
        'movie_post_custom_action_fields'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.inputFields'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        const fields = output.results;
        should.equal(fields.length, 4);
        should.equal(fields[0].key, 'title');
        should.equal(fields[1].key, 'genre');
        should.equal(fields[2].key, 'luckyNumber');
        should.equal(fields[3].key, 'year');
        should.equal(fields[3].type, 'integer');
      });
    });

    it('KEY_pre_custom_action_fields & KEY_post_custom_action_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacyScriptingSource = appDefWithAuth.legacyScriptingSource.replace(
        'movie_pre_custom_action_fields_disabled',
        'movie_pre_custom_action_fields'
      );
      appDefWithAuth.legacyScriptingSource = appDefWithAuth.legacyScriptingSource.replace(
        'movie_post_custom_action_fields_disabled',
        'movie_post_custom_action_fields'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.inputFields'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        const fields = output.results;
        should.equal(fields.length, 4);
        should.equal(fields[0].key, 'title');
        should.equal(fields[1].key, 'genre');
        should.equal(fields[2].key, 'luckyNumber');
        should.equal(fields[3].key, 'year');
        should.equal(fields[3].type, 'integer');
      });
    });

    it('KEY_custom_action_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacyScriptingSource = appDefWithAuth.legacyScriptingSource.replace(
        'movie_custom_action_fields_disabled',
        'movie_custom_action_fields'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.inputFields'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        const fields = output.results;
        should.equal(fields.length, 4);
        should.equal(fields[0].key, 'title');
        should.equal(fields[1].key, 'genre');
        should.equal(fields[2].key, 'luckyNumber');
        should.equal(fields[3].key, 'year');
        should.equal(fields[3].type, 'integer');
      });
    });

    it('scriptingless output fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.creates.movie.operation.legacyProperties.outputFieldsUrl +=
        's';

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.outputFields'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        const fields = output.results;
        should.equal(fields.length, 6);
        should.equal(fields[0].key, 'id');
        should.equal(fields[1].key, 'title');
        should.equal(fields[2].key, 'genre');
        should.equal(fields[3].key, 'id');
        should.equal(fields[4].key, 'color');
        should.equal(fields[5].key, 'age');
      });
    });


    it('KEY_pre_custom_action_result_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacyScriptingSource = appDefWithAuth.legacyScriptingSource.replace(
        'movie_pre_custom_action_result_fields_disabled',
        'movie_pre_custom_action_result_fields'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.outputFields'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        const fields = output.results;
        should.equal(fields.length, 6);
        should.equal(fields[0].key, 'id');
        should.equal(fields[1].key, 'title');
        should.equal(fields[2].key, 'genre');
        should.equal(fields[3].key, 'id');
        should.equal(fields[4].key, 'color');
        should.equal(fields[5].key, 'age');
      });
    });

    it('KEY_post_custom_action_result_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.creates.movie.operation.legacyProperties.outputFieldsUrl +=
        's';
      appDefWithAuth.legacyScriptingSource = appDefWithAuth.legacyScriptingSource.replace(
        'movie_post_custom_action_result_fields_disabled',
        'movie_post_custom_action_result_fields'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.outputFields'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        const fields = output.results;
        should.equal(fields.length, 7);
        should.equal(fields[0].key, 'id');
        should.equal(fields[1].key, 'title');
        should.equal(fields[2].key, 'genre');
        should.equal(fields[3].key, 'id');
        should.equal(fields[4].key, 'color');
        should.equal(fields[5].key, 'age');
        should.equal(fields[6].key, 'tagline');
        should.equal(fields[6].type, 'string');
      });
    });

    it('KEY_pre_custom_action_result_fields & KEY_post_custom_action_result_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacyScriptingSource = appDefWithAuth.legacyScriptingSource.replace(
        'movie_pre_custom_action_result_fields_disabled',
        'movie_pre_custom_action_result_fields'
      );
      appDefWithAuth.legacyScriptingSource = appDefWithAuth.legacyScriptingSource.replace(
        'movie_post_custom_action_result_fields_disabled',
        'movie_post_custom_action_result_fields'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.outputFields'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        const fields = output.results;
        should.equal(fields.length, 7);
        should.equal(fields[0].key, 'id');
        should.equal(fields[1].key, 'title');
        should.equal(fields[2].key, 'genre');
        should.equal(fields[3].key, 'id');
        should.equal(fields[4].key, 'color');
        should.equal(fields[5].key, 'age');
        should.equal(fields[6].key, 'tagline');
        should.equal(fields[6].type, 'string');
      });
    });

    it('KEY_custom_action_result_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacyScriptingSource = appDefWithAuth.legacyScriptingSource.replace(
        'movie_custom_action_result_fields_disabled',
        'movie_custom_action_result_fields'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.outputFields'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        const fields = output.results;
        should.equal(fields.length, 7);
        should.equal(fields[0].key, 'id');
        should.equal(fields[1].key, 'title');
        should.equal(fields[2].key, 'genre');
        should.equal(fields[3].key, 'id');
        should.equal(fields[4].key, 'color');
        should.equal(fields[5].key, 'age');
        should.equal(fields[6].key, 'tagline');
        should.equal(fields[6].type, 'string');
      });
    });
  });
});
