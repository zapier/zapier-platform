const _ = require('lodash');
const should = require('should');

const { AUTH_JSON_SERVER_URL } = require('./auth-json-server');
const apiKeyAuth = require('./example-app/api-key-auth');
const appDefinition = require('./example-app');
const oauth2Config = require('./example-app/oauth2');
const sessionAuthConfig = require('./example-app/session-auth');
const createApp = require('zapier-platform-core/src/create-app');
const createInput = require('zapier-platform-core/src/tools/create-input');
const schemaTools = require('zapier-platform-core/src/tools/schema');

const withAuth = (appDef, authConfig) => {
  return _.merge(_.cloneDeep(appDef), _.cloneDeep(authConfig));
};

// XXX: Allow to add custom app befores. Kind of hacky, but we can remove this once
// https://github.com/zapier/zapier-platform-core/pull/119 is shipped
const createAppWithCustomBefores = (appRaw, customBefores) => {
  const addAppContext = require('zapier-platform-core/src/app-middlewares/before/add-app-context');
  const injectZObject = require('zapier-platform-core/src/app-middlewares/before/z-object');
  const checkOutput = require('zapier-platform-core/src/app-middlewares/after/checks');
  const largeResponseCachePointer = require('zapier-platform-core/src/app-middlewares/after/large-response-cacher');
  const waitForPromises = require('zapier-platform-core/src/app-middlewares/after/wait-for-promises');
  const createCommandHandler = require('zapier-platform-core/src/create-command-handler');
  const applyMiddleware = require('zapier-platform-core/src/middleware');

  const frozenCompiledApp = schemaTools.prepareApp(appRaw);

  const befores = [addAppContext, injectZObject].concat(customBefores || []);
  const afters = [checkOutput, largeResponseCachePointer, waitForPromises];

  const app = createCommandHandler(frozenCompiledApp);
  return applyMiddleware(befores, afters, app);
};

describe('Integration Test', () => {
  const testLogger = (/* message, data */) => {
    // console.log(message, data);
    return Promise.resolve({});
  };

  const createTestInput = (compiledApp, method) => {
    const event = {
      command: 'execute',
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

    it('authentication.test', () => {
      const input = createTestInput(compiledApp, 'authentication.test');
      input.bundle.authData = {
        key1: 'sec',
        key2: 'ret'
      };
      input.bundle.meta = { test_poll: true };
      return app(input).then(output => {
        const user = output.results;
        should.equal(user.id, 1);
        should.equal(user.username, 'Bret');
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
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
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
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'pre_oauthv2_token',
        'dont_care'
      );
      appDefWithAuth.legacy.authentication.oauth2Config.accessTokenUrl +=
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
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'pre_oauthv2_refresh_auth_json_server',
        'pre_oauthv2_refresh'
      );
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

    it('pre_oauthv2_refresh, form, access token should not involve', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'pre_oauthv2_refresh_httpbin_form',
        'pre_oauthv2_refresh'
      );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.refreshAccessToken'
      );
      input.bundle.authData = {
        refresh_token: 'my_refresh_token',
        access_token: 'my_access_token'
      };
      return app(input).then(output => {
        const response = output.results;
        should.not.exist(response.headers.Authorization);
        should.equal(response.form.refresh_token, 'my_refresh_token');
      });
    });

    it('pre_oauthv2_refresh, json, access token should not involve', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'pre_oauthv2_refresh_httpbin_json',
        'pre_oauthv2_refresh'
      );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.refreshAccessToken'
      );
      input.bundle.authData = {
        refresh_token: 'my_refresh_token',
        access_token: 'my_access_token'
      };
      return app(input).then(output => {
        const response = output.results;
        should.not.exist(response.headers.Authorization);
        should.equal(response.json.refresh_token, 'my_refresh_token');
      });
    });
  });

  describe('polling trigger', () => {
    const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
    const compiledApp = schemaTools.prepareApp(appDefWithAuth);
    const app = createApp(appDefWithAuth);

    it('KEY_poll', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_no_id',
        'movie_post_poll'
      );
      const input = createTestInput(
        compiledApp,
        'triggers.contact_full.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.meta = {
        zap: { name: 'My Awesome Zap' }
      };
      return app(input).then(output => {
        output.results.length.should.greaterThan(1);

        const firstContact = output.results[0];
        should.equal(firstContact.name, 'Patched by KEY_poll!');
        should.equal(firstContact.zapTitle, 'My Awesome Zap');
      });
    });

    it('KEY_poll, with underscore', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_underscore',
        'movie_post_poll'
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      return _app(input).then(output => {
        const movies = output.results;
        movies[0].titleHas2.should.be.false();
        movies[1].titleHas2.should.be.true();
        movies[2].titleHas2.should.be.false();
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

    it('KEY_post_poll, with jQuery', () => {
      const input = createTestInput(
        compiledApp,
        'triggers.contact_post.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        output.results.length.should.greaterThan(1);

        const firstContact = output.results[0];
        should.equal(firstContact.name, 'Patched by KEY_post_poll!');
        should.equal(firstContact.jqueryText, 'jQuery works!');
        should.equal(firstContact.jqueryParam, 'width=1680&height=1050');
      });
    });

    it('KEY_post_poll, no id', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_no_id',
        'movie_post_poll'
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      return _app(input).then(output => {
        const movies = output.results;
        movies.length.should.greaterThan(1);
        movies.forEach(movie => {
          should.not.exist(movie.id);
          should.exist(movie.title);
        });
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

    it('KEY_pre_custom_trigger_fields', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
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
      appDef.legacy.triggers.contact_full.operation.outputFieldsUrl += 's';
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
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

    it('z.dehydrate', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_method_dehydration',
        'movie_post_poll'
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      return _app(input).then(output => {
        const movies = output.results;
        movies.length.should.greaterThan(1);
        movies.forEach(movie => {
          movie.user.should.startWith('hydrate|||');
          movie.user.should.endWith('|||hydrate');

          const payload = JSON.parse(movie.user.split('|||')[1]);
          should.equal(payload.type, 'method');
          should.equal(payload.method, 'hydrators.legacyMethodHydrator');
          should.equal(payload.bundle.method, 'getUser');
          should.equal(payload.bundle.bundle.userId, movie.id);
        });
      });
    });

    it('z.dehydrateFile', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_file_dehydration',
        'movie_post_poll'
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      return _app(input).then(output => {
        const movies = output.results;
        movies.length.should.greaterThan(1);
        movies.forEach(movie => {
          movie.trailer.should.startWith('hydrate|||');
          movie.trailer.should.endWith('|||hydrate');

          const payload = JSON.parse(movie.trailer.split('|||')[1]);
          should.equal(payload.type, 'file');
          should.equal(payload.method, 'hydrators.legacyFileHydrator');
          should.equal(
            payload.bundle.url,
            'https://auth-json-server.zapier.ninja/movies'
          );
          should.equal(payload.bundle.request.params.id, movie.id);
          should.equal(payload.bundle.meta.name, `movie ${movie.id}.json`);
          should.equal(payload.bundle.meta.length, 1234);
        });
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
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
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
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
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
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'contact_hook_scripting_catch_hook_returning_object',
        'contact_hook_scripting_catch_hook'
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
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
      appDef.legacy.triggers.contact_hook_scripting.operation.hookType =
        'notification';
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'contact_hook_scripting_catch_hook_returning_object',
        'contact_hook_scripting_catch_hook'
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
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
      appDef.legacy.triggers.contact_hook_scripting.operation.hookType =
        'notification';
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
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
        resource_url: `${AUTH_JSON_SERVER_URL}/users/3`
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
      appDef.legacy.triggers.contact_hook_scripting.operation.hookType =
        'notification';
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
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
        resource_url: `${AUTH_JSON_SERVER_URL}/users/3`
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
      appDef.legacy.triggers.contact_hook_scripting.operation.hookType =
        'notification';
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
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
        resource_url: `${AUTH_JSON_SERVER_URL}/users/3`
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
      appDef.legacy.triggers.contact_hook_scripting.operation.hookType =
        'notification';
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'contact_hook_scripting_pre_hook_disabled',
        'contact_hook_scripting_pre_hook'
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
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
        resource_url: `${AUTH_JSON_SERVER_URL}/users/3`
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
      input.bundle.inputData = { foo: 'bar' };
      input.bundle.targetUrl = 'http://foo.bar';
      input.bundle.meta = { zap: { id: 9511 } };
      return app(input).then(output => {
        should.equal(output.results.json.event, 'contact.created');
        should.equal(
          output.results.json.hidden_message,
          'pre_subscribe was here!'
        );
        should.equal(output.results.headers['X-Api-Key'], 'hey hey');
        should.equal(output.results.hiddenMessage, 'post_subscribe was here!');

        should.deepEqual(output.results.json.bundleAuthFields, {
          api_key: 'hey hey'
        });
        should.deepEqual(output.results.json.bundleTriggerFields, {
          foo: 'bar'
        });
        should.equal(output.results.json.bundleTargetUrl, 'http://foo.bar');
        should.equal(output.results.json.bundleEvent, 'contact.created');
        should.deepEqual(output.results.json.bundleZap, { id: 9511 });
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
      input.bundle.inputData = { foo: 'bar' };
      input.bundle.targetUrl = 'http://foo.bar';
      input.bundle.meta = { zap: { id: 9512 } };
      return app(input).then(output => {
        should.equal(output.results.request.method, 'DELETE');

        const echoed = output.results.json;
        should.equal(echoed.json.event, 'contact.created');
        should.equal(echoed.json.hidden_message, 'pre_unsubscribe was here!');
        should.equal(echoed.headers['X-Api-Key'], 'yo yo');

        should.deepEqual(echoed.json.bundleAuthFields, { api_key: 'yo yo' });
        should.deepEqual(echoed.json.bundleTriggerFields, { foo: 'bar' });
        should.equal(echoed.json.bundleTargetUrl, 'http://foo.bar');
        should.equal(echoed.json.bundleEvent, 'contact.created');
        should.deepEqual(echoed.json.bundleZap, { id: 9512 });
      });
    });
  });

  describe('create', () => {
    it('scriptingless perform', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.creates.movie.operation.url += 's';

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

    it('scriptingless perform, curlies in URL', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      const legacyProps = appDefWithAuth.legacy.creates.movie.operation;
      legacyProps.url = legacyProps.url.replace(
        '/movie',
        '/{{bundle.inputData.resource_name}}'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'The Dark Knight',
        genre: 'Drama',
        resource_name: 'movies'
      };
      return app(input).then(output => {
        const movie = output.results;
        should.exist(movie.id);
        should.not.exist(movie.title);
        should.equal(movie.genre, 'Drama');
      });
    });

    it('KEY_pre_write', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
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

    it('KEY_pre_write, unflatten data', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_pre_write_unflatten',
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
        meta__title: 'The Shape of Water',
        meta__genre: 'Fantasy'
      };
      input.bundle.inputDataRaw = {
        meta__title: '{{123__title}}',
        meta__genre: '{{234__genre}}'
      };
      return app(input).then(output => {
        const echoed = output.results.json;
        should.deepEqual(echoed.action_fields, {
          meta: {
            title: 'The Shape of Water',
            genre: 'Fantasy'
          }
        });
        should.deepEqual(echoed.action_fields_full, {
          meta__title: 'The Shape of Water',
          meta__genre: 'Fantasy'
        });
        should.deepEqual(echoed.action_fields_raw, {
          meta__title: '{{123__title}}',
          meta__genre: '{{234__genre}}'
        });
        should.deepEqual(echoed.orig_data, {
          meta: {
            title: 'The Shape of Water',
            genre: 'Fantasy'
          }
        });
      });
    });

    it('KEY_post_write', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.creates.movie.operation.url += 's';
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
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
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_pre_write_disabled',
        'movie_pre_write'
      );
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
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
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
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
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
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

    it('sync KEY_write, curlies in URL', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_write_sync',
        'movie_write'
      );
      const legacyProps = appDefWithAuth.legacy.creates.movie.operation;
      legacyProps.url = legacyProps.url.replace(
        '/movie',
        '/{{bundle.inputData.resource_name}}'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'La La Land',
        genre: 'Musical',
        resource_name: 'movie'
      };
      return app(input).then(output => {
        const movie = output.results;
        should.exist(movie.id);
        should.equal(movie.title, 'La La Land');
        should.equal(movie.genre, 'Musical');
        should.equal(movie.year, 2016);
      });
    });

    it('scriptingless input fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.creates.movie.operation.inputFieldsUrl += 's';

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
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
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
      appDefWithAuth.legacy.creates.movie.operation.inputFieldsUrl += 's';
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
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
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_pre_custom_action_fields_disabled',
        'movie_pre_custom_action_fields'
      );
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
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
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
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
      appDefWithAuth.legacy.creates.movie.operation.outputFieldsUrl += 's';

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
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
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
      appDefWithAuth.legacy.creates.movie.operation.outputFieldsUrl += 's';
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
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
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_pre_custom_action_result_fields_disabled',
        'movie_pre_custom_action_result_fields'
      );
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
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
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
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

    it('file upload, scriptingless', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'this is a pig.png',
        // In reality, file will always be a "hydrate URL" that looks something
        // like https://zapier.com/engine/hydrate/1/abcd/, but in fact any
        // valid URL would work.
        file: 'https://zapier-httpbin.herokuapp.com/image/png'
      };
      return app(input).then(output => {
        const file = output.results.file;
        should.equal(file.sha1, '379f5137831350c900e757b39e525b9db1426d53');
        should.equal(file.mimetype, 'image/png');
        should.equal(file.originalname, 'png');

        const data = JSON.parse(output.results.data);
        should.equal(data.filename, 'this is a pig.png');
      });
    });

    it('file upload, scriptingless redirect', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'this is a pig.png',
        file: 'https://zapier-httpbin.herokuapp.com/redirect-to?url=/image/png'
      };
      return app(input).then(output => {
        const file = output.results.file;
        should.equal(file.sha1, '379f5137831350c900e757b39e525b9db1426d53');
        should.equal(file.mimetype, 'image/png');
        should.equal(file.originalname, 'png');

        const data = JSON.parse(output.results.data);
        should.equal(data.filename, 'this is a pig.png');
      });
    });

    it('file upload, KEY_pre_write tweaks filename', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'file_pre_write_tweak_filename',
        'file_pre_write'
      );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'this is a pig.png',
        file: 'https://zapier-httpbin.herokuapp.com/image/png'
      };
      return app(input).then(output => {
        const file = output.results.file;
        should.equal(file.sha1, '379f5137831350c900e757b39e525b9db1426d53');
        should.equal(file.mimetype, 'image/png');
        should.equal(file.originalname, 'PNG');

        const data = JSON.parse(output.results.data);
        should.equal(data.filename, 'this is a pig.png');
      });
    });

    it('file upload, KEY_pre_write replaces hydrate url', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'file_pre_write_replace_hydrate_url',
        'file_pre_write'
      );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'this is a wolf.jpg',
        file: 'https://zapier-httpbin.herokuapp.com/image/png'
      };
      return app(input).then(output => {
        const file = output.results.file;
        should.equal(file.sha1, '44da0f5c0e4c27f945e97fccf59b69e06b767828');
        should.equal(file.mimetype, 'image/jpeg');
        should.equal(file.originalname, 'file_pre_write_was_here.png');

        const data = JSON.parse(output.results.data);
        should.equal(data.filename, 'this is a wolf.jpg');
      });
    });

    it('file upload, KEY_pre_write replaces with string content', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'file_pre_write_replace_with_string_content',
        'file_pre_write'
      );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'dont.care',
        file: 'https://zapier-httpbin.herokuapp.com/image/png'
      };
      return app(input).then(output => {
        const file = output.results.file;
        should.equal(file.sha1, 'e3076b0be57756b9e7e23192a9d29dfb0b3f4b31');
        should.equal(file.mimetype, 'text/plain');
        should.equal(file.originalname, 'png.txt');

        const data = JSON.parse(output.results.data);
        should.equal(data.filename, 'dont.care');
      });
    });

    it('file upload, KEY_pre_write fully replaces URL', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'file_pre_write_fully_replace_url',
        'file_pre_write'
      );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'dont.care',
        file: 'https://zapier-httpbin.herokuapp.com/image/png'
      };
      return app(input).then(output => {
        const file = output.results.file;
        should.equal(file.sha1, 'eb1db8fa7b8277f2de5d7b40d6cdbc708aac4e52');
        should.equal(file.mimetype, 'image/jpeg');
        should.equal(file.originalname, 'jpeg');

        const data = JSON.parse(output.results.data);
        should.equal(data.filename, 'dont.care');
      });
    });

    it('file upload, KEY_pre_write fully replaces content', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'file_pre_write_fully_replace_content',
        'file_pre_write'
      );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'dont.care',
        file: 'https://zapier-httpbin.herokuapp.com/image/png'
      };
      return app(input).then(output => {
        const file = output.results.file;
        should.equal(file.sha1, 'd17d3480b251a1556c3a4a48fdbd8a0aa2746c6f');
        should.equal(file.mimetype, 'text/plain');
        should.equal(file.originalname, 'fully replac ... .txt');

        const data = JSON.parse(output.results.data);
        should.equal(data.filename, 'dont.care');
      });
    });

    it('file upload, KEY_pre_write, content disposition with quotes', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'file_pre_write_content_dispoistion_with_quotes',
        'file_pre_write'
      );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'dont.care',
        file: 'https://zapier-httpbin.herokuapp.com/image/png'
      };
      return app(input).then(output => {
        const file = output.results.file;
        should.equal(file.sha1, '2912ad01b4da27374578a856fe6012a33ddcb08e');
        should.equal(file.mimetype, 'application/json');
        should.equal(file.originalname, 'an example.json');

        const data = JSON.parse(output.results.data);
        should.equal(data.filename, 'dont.care');
      });
    });

    it('file upload, KEY_pre_write, content disposition without quotes', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'file_pre_write_content_dispoistion_no_quotes',
        'file_pre_write'
      );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'dont.care',
        file: 'https://zapier-httpbin.herokuapp.com/image/png'
      };
      return app(input).then(output => {
        const file = output.results.file;
        should.equal(file.sha1, '0db061d2625b61f970ad4ed0db1167f433552395');
        should.equal(file.mimetype, 'application/json');
        should.equal(file.originalname, 'example.json');

        const data = JSON.parse(output.results.data);
        should.equal(data.filename, 'dont.care');
      });
    });

    it('file upload, KEY_pre_write, content disposition non-ascii', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'file_pre_write_content_dispoistion_non_ascii',
        'file_pre_write'
      );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'dont.care',
        file: 'https://zapier-httpbin.herokuapp.com/image/png'
      };
      return app(input).then(output => {
        const file = output.results.file;
        should.equal(file.sha1, 'a70183153aa29bfa87020ec30851cfde4dd08699');
        should.equal(file.mimetype, 'application/json');
        should.equal(file.originalname, '中文.json');

        const data = JSON.parse(output.results.data);
        should.equal(data.filename, 'dont.care');
      });
    });

    describe('legacyMethodHydrator', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      it('should get data if auth is correct', () => {
        const input = createTestInput(
          compiledApp,
          'hydrators.legacyMethodHydrator'
        );
        input.bundle.authData = { api_key: 'secret' };
        input.bundle.inputData = {
          method: 'getUser',
          bundle: {
            userId: 3
          }
        };
        return app(input).then(output => {
          const user = output.results;
          should.equal(user.id, 3);
          should.equal(user.name, 'Clementine Bauch');
        });
      });

      it('should fail if bad auth', () => {
        const input = createTestInput(
          compiledApp,
          'hydrators.legacyMethodHydrator'
        );
        input.bundle.authData = { api_key: 'bad key' };
        input.bundle.inputData = {
          method: 'getUser',
          bundle: {
            userId: 3
          }
        };
        return app(input).should.be.rejectedWith(/Unauthorized/);
      });

      it('should fail if no auth', () => {
        const input = createTestInput(
          compiledApp,
          'hydrators.legacyMethodHydrator'
        );
        input.bundle.inputData = {
          method: 'getUser',
          bundle: {
            userId: 3
          }
        };
        return app(input).should.be.rejectedWith(/Unauthorized/);
      });
    });

    describe('legacyFileHydrator', () => {
      const mockFileStahser = input => {
        // Mock z.stashFile to do nothing but return file content and meta
        input.z.stashFile = async (
          filePromise,
          knownLength,
          filename,
          contentType
        ) => {
          // Assuming filePromise gives us a JSON string
          const response = await filePromise;
          const buffer = await response.buffer();
          const content = buffer.toString('utf8');
          return {
            response,
            content: JSON.parse(content),
            knownLength,
            filename,
            contentType
          };
        };
        return input;
      };

      it('should send auth when no request options', () => {
        const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
        const compiledApp = schemaTools.prepareApp(appDefWithAuth);
        const app = createAppWithCustomBefores(appDefWithAuth, [
          mockFileStahser
        ]);

        const input = createTestInput(
          compiledApp,
          'hydrators.legacyFileHydrator'
        );
        input.bundle.authData = { api_key: 'super secret' };
        input.bundle.inputData = {
          // This endpoint echoes what we send to it, so we know if auth info was sent
          url: 'https://zapier-httpbin.herokuapp.com/get'
        };
        return app(input).then(output => {
          const {
            response,
            content,
            knownLength,
            filename,
            contentType
          } = output.results;
          should.equal(content.headers['X-Api-Key'], 'super secret');
          should.not.exist(knownLength);
          should.not.exist(filename);
          should.not.exist(contentType);

          // Make sure prepareResponse middleware was run
          response.getHeader.should.be.Function();
          should.equal(response.getHeader('content-type'), 'application/json');
        });
      });

      it('should not send auth when request options are present', () => {
        const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
        const compiledApp = schemaTools.prepareApp(appDefWithAuth);
        const app = createAppWithCustomBefores(appDefWithAuth, [
          mockFileStahser
        ]);

        const input = createTestInput(
          compiledApp,
          'hydrators.legacyFileHydrator'
        );
        input.bundle.authData = { api_key: 'super secret' };
        input.bundle.inputData = {
          // This endpoint echoes what we send to it, so we know if auth info was sent
          url: 'https://zapier-httpbin.herokuapp.com/get',
          request: {
            params: { foo: 1, bar: 'hello' }
          }
        };
        return app(input).then(output => {
          const {
            response,
            content,
            knownLength,
            filename,
            contentType
          } = output.results;

          should.equal(content.args.foo, '1');
          should.equal(content.args.bar, 'hello');
          should.not.exist(content.headers['X-Api-Key']);
          should.not.exist(knownLength);
          should.not.exist(filename);
          should.not.exist(contentType);

          // Make sure prepareResponse middleware was run
          response.getHeader.should.be.Function();
          should.equal(response.getHeader('content-type'), 'application/json');
        });
      });

      it('should send file meta', () => {
        const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
        const compiledApp = schemaTools.prepareApp(appDefWithAuth);
        const app = createAppWithCustomBefores(appDefWithAuth, [
          mockFileStahser
        ]);

        const input = createTestInput(
          compiledApp,
          'hydrators.legacyFileHydrator'
        );
        input.bundle.authData = { api_key: 'super secret' };
        input.bundle.inputData = {
          // This endpoint echoes what we send to it, so we know if auth info was sent
          url: 'https://zapier-httpbin.herokuapp.com/get',
          request: {
            params: { foo: 1, bar: 'hello' }
          },
          meta: {
            length: 1234,
            name: 'hello.json'
          }
        };
        return app(input).then(output => {
          const {
            response,
            content,
            knownLength,
            filename,
            contentType
          } = output.results;

          should.equal(content.args.foo, '1');
          should.equal(content.args.bar, 'hello');
          should.not.exist(content.headers['X-Api-Key']);
          should.equal(knownLength, 1234);
          should.equal(filename, 'hello.json');
          should.not.exist(contentType);

          // Make sure prepareResponse middleware was run
          response.getHeader.should.be.Function();
          should.equal(response.getHeader('content-type'), 'application/json');
        });
      });
    });
  });

  describe('search', () => {
    it('scriptingless perform', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      const legacyProps = appDefWithAuth.legacy.searches.movie.operation;
      legacyProps.url = legacyProps.url.replace('movie?', 'movies?');
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        query: 'title 10'
      };
      return app(input).then(output => {
        output.results.length.should.equal(1);

        const movie = output.results[0];
        should.equal(movie.id, 10);
        should.equal(movie.title, 'title 10');
      });
    });

    it('KEY_pre_search', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_pre_search_disabled',
        'movie_pre_search'
      );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        query: 'title 20'
      };
      return app(input).then(output => {
        output.results.length.should.equal(1);

        const movie = output.results[0];
        should.equal(movie.id, 20);
        should.equal(movie.title, 'title 20');
      });
    });

    it('KEY_post_search', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      const legacyProps = appDefWithAuth.legacy.searches.movie.operation;
      legacyProps.url = legacyProps.url.replace('movie?', 'movies?');
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_post_search_disabled',
        'movie_post_search'
      );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        query: 'title 20'
      };
      return app(input).then(output => {
        output.results.length.should.equal(1);

        const movie = output.results[0];
        should.equal(movie.id, 20);
        should.equal(movie.title, 'title 20 (movie_post_search was here)');
      });
    });

    it('KEY_pre_search & KEY_post_search', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_pre_search_disabled',
        'movie_pre_search'
      );
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_post_search_disabled',
        'movie_post_search'
      );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        query: 'title 20'
      };
      return app(input).then(output => {
        output.results.length.should.equal(1);

        const movie = output.results[0];
        should.equal(movie.id, 20);
        should.equal(movie.title, 'title 20 (movie_post_search was here)');
      });
    });

    it('KEY_search', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_search_disabled',
        'movie_search'
      );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.perform'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        query: 'title 12'
      };
      return app(input).then(output => {
        output.results.length.should.equal(1);

        const movie = output.results[0];
        should.equal(movie.id, 12);
        should.equal(movie.title, 'title 12 (movie_search was here)');
      });
    });

    it('scriptingless resource', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      const legacyProps = appDefWithAuth.legacy.searches.movie.operation;
      legacyProps.resourceUrl = legacyProps.resourceUrl.replace(
        '/movie/',
        '/movies/'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.performGet'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        id: 5
      };
      return app(input).then(output => {
        const movie = output.results;
        should.equal(movie.id, 5);
        should.equal(movie.title, 'title 5');
      });
    });

    it('KEY_pre_read_resource', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_pre_read_resource_disabled',
        'movie_pre_read_resource'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.performGet'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = { id: 5 };
      return app(input).then(output => {
        const movie = output.results;
        should.equal(movie.id, 5);
        should.equal(movie.title, 'title 5');
      });
    });

    it('KEY_post_read_resource', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      const legacyProps = appDefWithAuth.legacy.searches.movie.operation;
      legacyProps.resourceUrl = legacyProps.resourceUrl.replace(
        '/movie/',
        '/movies/'
      );
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_post_read_resource_disabled',
        'movie_post_read_resource'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.performGet'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = { id: 6 };
      return app(input).then(output => {
        const movie = output.results;
        should.equal(movie.id, 6);
        should.equal(
          movie.title,
          'title 6 (movie_post_read_resource was here)'
        );
        should.equal(movie.anotherId, 6);
      });
    });

    it('KEY_pre_read_resource & KEY_post_read_resource', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_pre_read_resource_disabled',
        'movie_pre_read_resource'
      );
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_post_read_resource_disabled',
        'movie_post_read_resource'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.performGet'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = { id: 7 };
      return app(input).then(output => {
        const movie = output.results;
        should.equal(movie.id, 7);
        should.equal(
          movie.title,
          'title 7 (movie_post_read_resource was here)'
        );
        should.equal(movie.anotherId, 7);
      });
    });

    it('KEY_read_resource', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_read_resource_disabled',
        'movie_read_resource'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.performGet'
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = { id: 8 };
      return app(input).then(output => {
        const movie = output.results;
        should.equal(movie.id, 8);
        should.equal(movie.title, 'title 8 (movie_read_resource was here)');
      });
    });

    it('scriptingless input fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.searches.movie.operation.inputFieldsUrl += 's';

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.inputFields'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        const fields = output.results;
        should.equal(fields.length, 2);
        should.equal(fields[0].key, 'query');
        should.equal(fields[1].key, 'luckyNumber');
      });
    });

    it('KEY_pre_custom_search_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_pre_custom_search_fields_disabled',
        'movie_pre_custom_search_fields'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.inputFields'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        const fields = output.results;
        should.equal(fields.length, 2);
        should.equal(fields[0].key, 'query');
        should.equal(fields[1].key, 'luckyNumber');
      });
    });

    it('KEY_post_custom_search_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.searches.movie.operation.inputFieldsUrl += 's';
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_post_custom_search_fields_disabled',
        'movie_post_custom_search_fields'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.inputFields'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        const fields = output.results;
        should.equal(fields.length, 3);
        should.equal(fields[0].key, 'query');
        should.equal(fields[1].key, 'luckyNumber');
        should.equal(fields[2].key, 'year');
        should.equal(fields[2].type, 'integer');
      });
    });

    it('KEY_pre_custom_search_fields & KEY_post_custom_search_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_pre_custom_search_fields_disabled',
        'movie_pre_custom_search_fields'
      );
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_post_custom_search_fields_disabled',
        'movie_post_custom_search_fields'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.inputFields'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        const fields = output.results;
        should.equal(fields.length, 3);
        should.equal(fields[0].key, 'query');
        should.equal(fields[1].key, 'luckyNumber');
        should.equal(fields[2].key, 'year');
        should.equal(fields[2].type, 'integer');
      });
    });

    it('KEY_custom_search_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_custom_search_fields_disabled',
        'movie_custom_search_fields'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.inputFields'
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(output => {
        const fields = output.results;
        should.equal(fields.length, 3);
        should.equal(fields[0].key, 'query');
        should.equal(fields[1].key, 'luckyNumber');
        should.equal(fields[2].key, 'year');
        should.equal(fields[2].type, 'integer');
      });
    });

    it('scriptingless output fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.searches.movie.operation.outputFieldsUrl += 's';

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.outputFields'
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

    it('KEY_pre_custom_search_result_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_pre_custom_search_result_fields_disabled',
        'movie_pre_custom_search_result_fields'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.outputFields'
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

    it('KEY_post_custom_search_result_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.searches.movie.operation.outputFieldsUrl += 's';
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_post_custom_search_result_fields_disabled',
        'movie_post_custom_search_result_fields'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.outputFields'
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

    it('KEY_pre_custom_search_result_fields & KEY_post_custom_search_result_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_pre_custom_search_result_fields_disabled',
        'movie_pre_custom_search_result_fields'
      );
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_post_custom_search_result_fields_disabled',
        'movie_post_custom_search_result_fields'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.outputFields'
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

    it('KEY_custom_search_result_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource = appDefWithAuth.legacy.scriptingSource.replace(
        'movie_custom_search_result_fields_disabled',
        'movie_custom_search_result_fields'
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.outputFields'
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
