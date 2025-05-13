const http = require('http');
const https = require('https');

const _ = require('lodash');
const should = require('should');
const nock = require('nock');

const { AUTH_JSON_SERVER_URL, HTTPBIN_URL } = require('./constants');
const apiKeyAuth = require('./example-app/api-key-auth');
const appDefinition = require('./example-app');
const oauth2Config = require('./example-app/oauth2');
const sessionAuthConfig = require('./example-app/session-auth');
const createApp = require('zapier-platform-core/src/create-app');
const createHttpPatch = require('zapier-platform-core/src/tools/create-http-patch');
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

describe('Integration Test', function () {
  this.retries(3); // retry up to 3 times

  const logs = [];
  const testLogger = (message, data) => {
    logs.push({ ...data, message });
    return Promise.resolve({});
  };

  const createTestInput = (compiledApp, method) => {
    const event = {
      command: 'execute',
      bundle: {},
      method,
    };
    return createInput(compiledApp, event, testLogger);
  };

  beforeEach(() => {
    if (nock.isActive()) {
      nock.restore();
    }

    const httpPatch = createHttpPatch({});
    httpPatch(http, testLogger);
    httpPatch(https, testLogger);

    logs.length = 0; // clear logs
  });

  describe('session auth', () => {
    const appDefWithAuth = withAuth(appDefinition, sessionAuthConfig);
    const compiledApp = schemaTools.prepareApp(appDefWithAuth);
    const app = createApp(appDefWithAuth);

    it('get_session_info', () => {
      const input = createTestInput(
        compiledApp,
        'authentication.sessionConfig.perform',
      );
      input.bundle.authData = {
        username: 'user',
        password: 'secret',
      };
      return app(input).then((output) => {
        should.equal(output.results.key1, 'sec');
        should.equal(output.results.key2, 'ret');
      });
    });
  });

  describe('authentication', () => {
    const appDefWithAuth = withAuth(appDefinition, sessionAuthConfig);
    const compiledApp = schemaTools.prepareApp(appDefWithAuth);
    const app = createApp(appDefWithAuth);

    it('get_connection_label', () => {
      const input = createTestInput(
        compiledApp,
        'authentication.connectionLabel',
      );
      input.bundle.inputData = {
        name: 'Mark',
      };
      return app(input).then((output) => {
        should.equal(output.results, 'Hi Mark');
      });
    });

    it('authentication.test, core >= 8.0.0', () => {
      const input = createTestInput(compiledApp, 'authentication.test');
      input.bundle.authData = {
        key1: 'sec',
        key2: 'ret',
      };
      input.bundle.meta = { isTestingAuth: true };
      return app(input).then((output) => {
        const user = output.results;
        should.equal(user.id, 2);
        should.equal(user.username, 'Antonette');
      });
    });

    it('authentication.test, core < 9.0.0', () => {
      const input = createTestInput(compiledApp, 'authentication.test');
      input.bundle.authData = {
        key1: 'sec',
        key2: 'ret',
      };
      input.bundle.meta = { standard_poll: false, test_poll: true };
      return app(input).then((output) => {
        const user = output.results;
        should.equal(user.id, 2);
        should.equal(user.username, 'Antonette');
      });
    });
  });

  describe('oauth2', () => {
    let origEnv;

    beforeEach(() => {
      origEnv = process.env;
      process.env = {
        CLIENT_ID: '1234',
        CLIENT_SECRET: 'asdf',
      };
    });

    afterEach(() => {
      process.env = origEnv;
    });

    it('oauth2 authorizeUrl, dynamic client id', () => {
      process.env.CLIENT_ID = '{{my_client_id}}';
      process.env.CLIENT_SECRET = '{{my_client_secret}}';

      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.authorizeUrl',
      );
      input.bundle.inputData = {
        my_client_id: '1234',
        redirect_uri: 'https://example.com',
        state: 'qwerty',
      };
      return app(input).then((output) => {
        should.equal(
          output.results,
          `${AUTH_JSON_SERVER_URL}/oauth/authorize?` +
            'client_id=1234&redirect_uri=https%3A%2F%2Fexample.com&' +
            'response_type=code&state=qwerty',
        );
      });
    });

    it('oauth2 authorizeUrl, redirect_uri and state replacement', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      appDefWithAuth.legacy.authentication.oauth2Config.authorizeUrl +=
        '?redirect_uri=https%3A%2F%2Fexample.com%2Fold&state=abcd';
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.authorizeUrl',
      );
      input.bundle.inputData = {
        redirect_uri: 'https://example.com/new',
        state: 'qwerty',
      };
      return app(input).then((output) => {
        should.equal(
          output.results,
          `${AUTH_JSON_SERVER_URL}/oauth/authorize?` +
            'client_id=1234&' +
            'redirect_uri=https%3A%2F%2Fexample.com%2Fnew&' +
            'response_type=code&state=qwerty',
        );
      });
    });

    it('oauth2 authorizeUrl, curly replacement', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      appDefWithAuth.legacy.authentication.oauth2Config.authorizeUrl =
        '{{base_url}}/authorize';
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.authorizeUrl',
      );

      // inputData should take precedence over authData for authorizeUrl. This
      // is because on CLI authData always holds the *saved* auth fields, and
      // when rendering authorizeUrl, auth fields are not saved yet.
      input.bundle.authData = {
        base_url: 'https://from.auth.data',
      };
      input.bundle.inputData = {
        base_url: 'https://from.input.data',
        redirect_uri: 'https://example.com',
        state: 'qwerty',
      };
      return app(input).then((output) => {
        should.equal(
          output.results,
          'https://from.input.data/authorize?' +
            'client_id=1234&' +
            'redirect_uri=https%3A%2F%2Fexample.com&' +
            'response_type=code&state=qwerty',
        );
      });
    });

    it('oauth2 getAccessToken curly replacement', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      appDefWithAuth.legacy.authentication.oauth2Config.accessTokenUrl =
        '{{base_url}}/oauth/access-token';
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.getAccessToken',
      );
      // inputData should take precedence over authData for getAccessToken. This
      // is because on CLI authData always holds the *saved* auth fields, and
      // when rendering accessToekUrl, auth fields are not saved yet.
      input.bundle.authData = {
        base_url: HTTPBIN_URL,
      };
      input.bundle.inputData = {
        base_url: AUTH_JSON_SERVER_URL,
        redirect_uri: 'https://example.com',
        code: 'one_time_code',
      };
      return app(input).then((output) => {
        should.equal(output.results.access_token, 'a_token');
        should.equal(output.results.something_custom, 'alright!');
        should.not.exist(output.results.name);
      });
    });

    it('pre_oauthv2_token', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'pre_oauthv2_token_basic',
          'pre_oauthv2_token',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.getAccessToken',
      );
      input.bundle.inputData = {
        redirect_uri: 'https://example.com',
        code: 'one_time_code',
      };
      return app(input).then((output) => {
        should.equal(output.results.access_token, 'a_token');
        should.equal(output.results.something_custom, 'alright!');
        should.not.exist(output.results.name);
      });
    });

    it('post_oauthv2_token', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'post_oauthv2_token_basic',
          'post_oauthv2_token',
        );
      appDefWithAuth.legacy.authentication.oauth2Config.accessTokenUrl +=
        'token';
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.getAccessToken',
      );
      input.bundle.inputData = {
        redirect_uri: 'https://example.com',
        code: 'one_time_code',
      };
      return app(input).then((output) => {
        should.equal(output.results.access_token, 'a_token');
        should.equal(output.results.something_custom, 'alright!!!');
        should.equal(output.results.name, 'Jane Doe');
      });
    });

    it('pre_oauthv2_token & post_oauthv2_token', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'pre_oauthv2_token_basic',
          'pre_oauthv2_token',
        );
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'post_oauthv2_token_basic',
          'post_oauthv2_token',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.getAccessToken',
      );
      input.bundle.inputData = {
        redirect_uri: 'https://example.com',
        code: 'one_time_code',
      };
      return app(input).then((output) => {
        should.equal(output.results.access_token, 'a_token');
        should.equal(output.results.something_custom, 'alright!!!');
        should.equal(output.results.name, 'Jane Doe');
      });
    });

    it('pre_oauthv2_token, payload only in params', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'pre_oauthv2_token_payload_only_in_params',
          'pre_oauthv2_token',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.getAccessToken',
      );
      input.bundle.inputData = {
        redirect_uri: 'https://example.com',
        code: 'one_time_code',
      };
      return app(input).then((output) => {
        should.equal(output.results.access_token, 'a_token');
      });
    });

    it('pre_oauthv2_token, yet to save auth_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'pre_oauthv2_token_yet_to_save_auth_fields',
          'pre_oauthv2_token',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.getAccessToken',
      );
      // inputData should take precedence over authData
      input.bundle.authData = {
        something_custom: 'hi',
      };
      input.bundle.inputData = {
        redirect_uri: 'https://example.com',
        code: 'one_time_code',
        something_custom: 'hey',
      };
      return app(input).then((output) => {
        const echoed = output.results;
        should.deepEqual(echoed.form, {
          something_custom: ['hey'],
        });
      });
    });

    it('pre_oauthv2_refresh', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'pre_oauthv2_refresh_auth_json_server',
          'pre_oauthv2_refresh',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.refreshAccessToken',
      );
      input.bundle.authData = {
        refresh_token: 'a_refresh_token',
      };
      return app(input).then((output) => {
        should.equal(output.results.access_token, 'a_token');
      });
    });

    it('pre_oauthv2_refresh, form, access token should not involve', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'pre_oauthv2_refresh_httpbin_form',
          'pre_oauthv2_refresh',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.refreshAccessToken',
      );
      input.bundle.authData = {
        refresh_token: 'my_refresh_token',
        access_token: 'my_access_token',
      };
      return app(input).then((output) => {
        const response = output.results;
        should.not.exist(response.headers.Authorization);
        should.equal(response.form.refresh_token, 'my_refresh_token');
      });
    });

    it('pre_oauthv2_refresh, json, access token should not involve', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'pre_oauthv2_refresh_httpbin_json',
          'pre_oauthv2_refresh',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.refreshAccessToken',
      );
      input.bundle.authData = {
        refresh_token: 'my_refresh_token',
        access_token: 'my_access_token',
      };
      return app(input).then((output) => {
        const response = output.results;
        should.not.exist(response.headers.Authorization);
        should.equal(response.json.refresh_token, 'my_refresh_token');
      });
    });

    it('pre_oauthv2_refresh, request.data should be an object', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'pre_oauthv2_refresh_request_data',
          'pre_oauthv2_refresh',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);
      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.refreshAccessToken',
      );
      input.bundle.authData = {
        refresh_token: 'my_refresh_token',
        access_token: 'my_access_token',
      };
      input.bundle.inputData = {
        redirect_uri: 'https://zapier.rodeo/auth/abc123',
      };
      return app(input).then((output) => {
        const data = output.results.form;

        should.deepEqual(data, {
          bar: ['world'],
          client_id: [process.env.CLIENT_ID],
          client_secret: [process.env.CLIENT_SECRET],
          foo: ['hello'],
          grant_type: ['refresh_token'],
          refresh_token: ['my_refresh_token'],
          redirect_uri: ['https://zapier.rodeo/auth/abc123'],
        });
      });
    });

    it('pre_oauthv2_refresh, does not retry', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'pre_oauthv2_refresh_does_not_retry',
          'pre_oauthv2_refresh',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);
      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.refreshAccessToken',
      );
      input.bundle.authData = {
        refresh_token: 'my_refresh_token',
        access_token: 'my_access_token',
      };
      input.bundle.inputData = {
        redirect_uri: 'https://zapier.rodeo/auth/abc123',
      };
      return app(input).then((output) => {
        const data = output.results.form;
        const params = output.results.args;

        should.deepEqual(data, {
          client_id: [process.env.CLIENT_ID],
          client_secret: [process.env.CLIENT_SECRET],
          grant_type: ['refresh_token'],
          refresh_token: ['my_refresh_token'],
          redirect_uri: ['https://zapier.rodeo/auth/abc123'],
        });
        should.deepEqual(params, {});
      });
    });

    it('pre_oauthv2_refresh, bundle.load', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'pre_oauthv2_refresh_bundle_load',
          'pre_oauthv2_refresh',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);
      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.refreshAccessToken',
      );
      input.bundle.authData = {
        refresh_token: 'my_refresh_token',
        access_token: 'my_access_token',
      };
      input.bundle.inputData = {
        redirect_uri: 'https://zapier.rodeo/auth/abc123',
      };
      return app(input).then((output) => {
        const response = output.results;
        should.not.exist(response.headers.Authorization);
        should.deepEqual(response.form, {
          client_id: [process.env.CLIENT_ID],
          client_secret: [process.env.CLIENT_SECRET],
          grant_type: ['refresh_token'],
          refresh_token: ['my_refresh_token'],
          redirect_uri: ['https://zapier.rodeo/auth/abc123'],
        });
      });
    });

    it('post_oauthv2_token, returns nothing', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'post_oauthv2_token_returns_nothing',
          'post_oauthv2_token',
        );
      appDefWithAuth.legacy.authentication.oauth2Config.accessTokenUrl +=
        'token';
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'authentication.oauth2Config.getAccessToken',
      );
      input.bundle.inputData = {
        redirect_uri: 'https://example.com',
        code: 'one_time_code',
      };
      return app(input).then((output) => {
        should.equal(output.results.access_token, 'a_token');
        should.equal(output.results.something_custom, 'alright!');
        should.not.exist(output.results.name);
      });
    });

    it('throw for stale auth', () => {
      const appDefWithAuth = withAuth(appDefinition, oauth2Config);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'triggers.test.operation.perform',
      );
      input.bundle.authData = { access_token: 'stale_token' };
      return app(input).should.be.rejectedWith({ name: 'RefreshAuthError' });
    });
  });

  describe('polling trigger', () => {
    const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
    const compiledApp = schemaTools.prepareApp(appDefWithAuth);
    const app = createApp(appDefWithAuth);

    it('scriptingless, curlies in URL', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_make_array',
        'recipe_post_poll',
      );
      appDef.legacy.triggers.recipe.operation.url = `${HTTPBIN_URL}/get?name={{name}}&active={{active}}`;
      const _compiledApp = schemaTools.prepareApp(appDef);
      const _app = createApp(appDef);

      const input = createTestInput(
        _compiledApp,
        'triggers.recipe.operation.perform',
      );
      input.bundle.authData = { name: 'john' };
      input.bundle.inputData = { name: 'johnny', active: false };
      return _app(input).then((output) => {
        const echoed = output.results[0];
        should.deepEqual(echoed.args, { name: ['john'], active: ['False'] });
        should.equal(echoed.url, `${HTTPBIN_URL}/get?name=john&active=False`);
      });
    });

    it('scriptingless, null response', () => {
      if (!nock.isActive()) {
        nock.activate();
      }
      // Mock the response with a string 'null'
      nock(AUTH_JSON_SERVER_URL).get('/movies').reply(200, 'null');

      const appDef = _.cloneDeep(appDefinition);
      const _compiledApp = schemaTools.prepareApp(appDef);
      const _app = createApp(appDef);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      return _app(input).then((output) => {
        should.deepEqual(output.results, []);
      });
    });

    it('scriptingless, empty scripting string should be fine', () => {
      if (!nock.isActive()) {
        nock.activate();
      }
      // Mock the response with a string 'null'
      nock(AUTH_JSON_SERVER_URL).get('/movies').reply(200, '[]');

      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = ''; // rare case, but it's happened
      const _compiledApp = schemaTools.prepareApp(appDef);
      const _app = createApp(appDef);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      return _app(input).then((output) => {
        should.deepEqual(output.results, []);
      });
    });

    it('scriptingless, empty auth mapping', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_make_array',
        'movie_post_poll',
      );
      const _appDefWithAuth = withAuth(appDef, sessionAuthConfig);
      _appDefWithAuth.legacy.authentication.mapping = {};
      _appDefWithAuth.legacy.authentication.placement = 'querystring';
      _appDefWithAuth.legacy.triggers.movie.operation.url = `${HTTPBIN_URL}/get`;

      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      input.bundle.authData = {
        api_key: 'hello',
      };
      return _app(input).then((output) => {
        const echoed = output.results[0];
        // Default to authData if auth mapping is empty
        should.deepEqual(echoed.args, { api_key: ['hello'] });
      });
    });

    it('scriptingless, no empty query params', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_make_array',
        'movie_post_poll',
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      _appDefWithAuth.legacy.authentication.mapping = {
        api_key: '{{api_key}}',
      };
      _appDefWithAuth.legacy.authentication.placement = 'querystring';
      _appDefWithAuth.legacy.triggers.movie.operation.url = `${HTTPBIN_URL}/get?other=foo`;

      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      input.bundle.authData = {
        api_key: 'secret',
      };
      return _app(input).then((output) => {
        const echoed = output.results[0];
        should.deepEqual(echoed.args, { api_key: ['secret'], other: ['foo'] });
      });
    });

    it('KEY_poll', () => {
      const input = createTestInput(
        compiledApp,
        'triggers.contact_full.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.meta = {
        zap: { name: 'My Awesome Zap' },
      };
      return app(input).then((output) => {
        should.equal(output.results.length, 1);

        const firstContact = output.results[0];
        should.equal(firstContact.name, 'Patched by KEY_poll!');
        should.equal(firstContact.zapTitle, 'My Awesome Zap');

        // There should be a log for the http request and the bundle
        should.equal(logs.length, 2);

        // http log
        logs[0].should.containDeep({
          message: `200 GET ${AUTH_JSON_SERVER_URL}/users`,
          log_type: 'http',
          request_url: `${AUTH_JSON_SERVER_URL}/users`,
          request_method: 'GET',
          request_headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Api-Key': 'secret',
          },
          request_params: { id: '2' },
          response_status_code: 200,
          response_headers: {
            'content-type': 'application/json; charset=utf-8',
          },
        });

        const loggedResponseData = JSON.parse(logs[0].response_content);
        loggedResponseData.length.should.eql(1);
        loggedResponseData[0].should.containEql({
          id: 2,
          username: 'Antonette',
        });

        // bundle log
        logs[1].should.containDeep({
          message: 'Called legacy scripting contact_full_poll',
          log_type: 'bundle',
          input: {
            request: {
              url: '',
            },
            auth_fields: { api_key: 'secret' },
          },
          output: [
            { id: 2, username: 'Antonette', name: 'Patched by KEY_poll!' },
          ],
        });
      });
    });

    it('KEY_poll, with underscore', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_underscore',
        'movie_post_poll',
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      return _app(input).then((output) => {
        const movies = output.results;
        movies[0].titleHas2.should.be.false();
        movies[1].titleHas2.should.be.true();
        movies[2].titleHas2.should.be.false();
      });
    });

    it('KEY_poll, header case', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_header_case',
        'movie_post_poll',
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      return _app(input).then((output) => {
        const movies = output.results;
        should.equal(movies[0].contentType, 'application/json; charset=utf-8');
      });
    });

    it('KEY_poll, default headers', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_poll_default_headers',
        'movie_poll',
      );
      const _compiledApp = schemaTools.prepareApp(appDef);
      const _app = createApp(appDef);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      return _app(input).then((output) => {
        const echoed = output.results[0];
        should.equal(echoed.headers.Accept[0], 'application/json');
        should.equal(
          echoed.headers['Content-Type'][0],
          'application/json; charset=utf-8',
        );
        should.equal(echoed.args.accept[0], 'application/json');
        should.equal(
          echoed.args.contentType[0],
          'application/json; charset=utf-8',
        );
      });
    });

    it('KEY_poll, StopRequestException', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_poll_stop_request',
        'movie_poll',
      );
      const _compiledApp = schemaTools.prepareApp(appDef);
      const _app = createApp(appDef);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      return _app(input).then((output) => {
        should.deepEqual(output.results, []);
      });
    });

    it('KEY_poll, z.request using uri', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_poll_z_request_uri',
        'movie_poll',
      );
      const _compiledApp = schemaTools.prepareApp(appDef);
      const _app = createApp(appDef);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      return _app(input).then((output) => {
        const echoed = output.results[0];
        should.equal(echoed.url, `${HTTPBIN_URL}/get`);

        // There should be a log for the http request and the bundle
        should.equal(logs.length, 2);
        should.equal(logs[0].message, `200 GET ${HTTPBIN_URL}/get`);
        should.equal(logs[1].message, `Called legacy scripting movie_poll`);
      });
    });

    it('KEY_pre_poll', () => {
      const input = createTestInput(
        compiledApp,
        'triggers.contact_pre.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
        output.results.length.should.equal(1);

        const contact = output.results[0];
        should.equal(contact.id, 3);
      });
    });

    it('KEY_pre_poll, default headers', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_poll_default_headers',
        'movie_pre_poll',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_make_array',
        'movie_post_poll',
      );
      const _compiledApp = schemaTools.prepareApp(appDef);
      const _app = createApp(appDef);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      return _app(input).then((output) => {
        const echoed = output.results[0];
        should.equal(echoed.headers.Accept[0], 'application/json');
        should.equal(
          echoed.headers['Content-Type'][0],
          'application/json; charset=utf-8',
        );
        should.equal(echoed.args.accept[0], 'application/json');
        should.equal(
          echoed.args.contentType[0],
          'application/json; charset=utf-8',
        );
      });
    });

    it('KEY_pre_poll, dynamic dropdown', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_poll_dynamic_dropdown',
        'movie_pre_poll',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_make_array',
        'movie_post_poll',
      );
      const _compiledApp = schemaTools.prepareApp(appDef);
      const _app = createApp(appDef);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      input.bundle.meta = {
        isFillingDynamicDropdown: true,
      };
      input.bundle.inputData = {
        name: 'test',
        greeting: 'hello',
      };
      return _app(input).then((output) => {
        const echoed = output.results[0];

        // When pulling for a dynamic dropdown (DD), bundle.inputData and
        // bundle.inputDataRaw are not really from the trigger that powers the
        // dynamic dropdown. Instead, they come from the input fields of the
        // action/search/trigger that pulls the DD. So we shouldn't include
        // bundle.inputData in request.params.
        should.not.exist(echoed.args.name);
        should.not.exist(echoed.args.greeting);

        // However, bundle.trigger_fields should still contain values of the
        // input fields of the action/search/trigger that pulls the DD.
        // bundle.trigger_fields was sent via request.data from scripting, so it
        // should be available as response.json here.
        should.equal(echoed.json.name, 'test');
        should.equal(echoed.json.greeting, 'hello');
      });
    });

    it('KEY_pre_poll, null request.data', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_poll_null_request_data',
        'movie_pre_poll',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_make_array',
        'movie_post_poll',
      );
      const _compiledApp = schemaTools.prepareApp(appDef);
      const _app = createApp(appDef);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      return _app(input).then((output) => {
        const echoed = output.results[0];
        should.equal(echoed.args.requestDataIsNull[0], 'yes');
      });
    });

    it('KEY_pre_poll, bundle.meta', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_poll_bundle_meta',
        'movie_pre_poll',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_make_array',
        'movie_post_poll',
      );
      const _compiledApp = schemaTools.prepareApp(appDef);
      const _app = createApp(appDef);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      input.bundle.meta = {
        isLoadingSample: true,
        isFillingDynamicDropdown: true,
        isTestingAuth: false,
        isPopulatingDedupe: true,
        limit: 20,
        page: 1,
        isBulkRead: false,
      };
      return _app(input).then((output) => {
        const echoed = output.results[0];
        should.deepEqual(echoed.json, {
          auth_test: false,
          first_poll: true,
          frontend: true,
          prefill: true,
          standard_poll: true,
          test_poll: false,
          hydrate: true,
          limit: 20,
          page: 1,
          isBulkRead: false,
        });
      });
    });

    it('KEY_pre_poll, invalid chars in headers', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_poll_invalid_chars_in_headers',
        'movie_pre_poll',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_make_array',
        'movie_post_poll',
      );
      const _compiledApp = schemaTools.prepareApp(appDef);
      const _app = createApp(appDef);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      return _app(input).then((output) => {
        const echoed = output.results[0];
        should.equal(echoed.headers['X-Api-Key'], 'H E Y');
      });
    });

    it('KEY_pre_poll, hash in headers', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_poll_number_header',
        'movie_pre_poll',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_make_array',
        'movie_post_poll',
      );
      const _compiledApp = schemaTools.prepareApp(appDef);
      const _app = createApp(appDef);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      return _app(input).then((output) => {
        const echoed = output.results[0];
        should.exist(echoed.headers['X-Api-Key']);
      });
    });

    it('KEY_pre_poll, hash in headers', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_poll_urlencode',
        'movie_pre_poll',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_make_array',
        'movie_post_poll',
      );
      const _compiledApp = schemaTools.prepareApp(appDef);
      const _app = createApp(appDef);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      return _app(input).then((output) => {
        const echoed = output.results[0];
        should.equal(echoed.query.url, 'https://example.com');
      });
    });

    it('KEY_pre_poll, this binding', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_poll_this_binding',
        'movie_pre_poll',
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      return _app(input).then((output) => {
        const movies = output.results;
        movies.length.should.greaterThan(1);
        should.equal(movies[0].title, 'title 1');
      });
    });

    it('KEY_pre_poll, error properly', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_poll_error',
        'movie_pre_poll',
      );
      const compiledApp = schemaTools.prepareApp(appDef);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'triggers.movie.operation.perform',
      );
      return app(input).should.be.rejectedWith(/of undefined/);
    });

    it('KEY_pre_poll, _.template(bundle.request.url)', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'recipe_pre_poll_underscore_template',
        'recipe_pre_poll',
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.recipe.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      return _app(input).then((output) => {
        const firstRecipe = output.results[0];
        should.equal(firstRecipe.name, 'name 1');
      });
    });

    it('KEY_pre_poll, array curlies', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.triggers.movie.operation.url = `${HTTPBIN_URL}/get?things={{things}}`;
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_make_array',
        'movie_post_poll',
      );

      // appDef will be injected to `input` as `input._zapier.app` by
      // createInput(). core has an injectInput beforeRequest middleware that
      // inject `input` to the request object. When core does prepareRequest,
      // it's going to replace every curlies in req.input._zapier.app. So apart
      // from the request options passed into z.request, we also need to make
      // sure array curlies from another trigger/action don't break either.
      appDef.legacy.triggers.recipe.operation.url =
        'https://example.com?things={{bundle.inputData.things}}';

      const compiledApp = schemaTools.prepareApp(appDef);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'triggers.movie.operation.perform',
      );
      input.bundle.inputData = {
        things: ['eyedrops', 'cyclops', 'ipod'],
      };
      return app(input).then((output) => {
        const req = output.results[0];
        req.args.should.deepEqual({
          things: ['eyedrops,cyclops,ipod'],
        });
        req.url.should.equal(
          `${HTTPBIN_URL}/get?things=eyedrops%2Ccyclops%2Cipod`,
        );
      });
    });

    it('KEY_pre_poll, GET with body', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_poll_GET_with_body',
        'movie_pre_poll',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_make_array',
        'movie_post_poll',
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      return _app(input).then((output) => {
        const echoed = output.results[0];
        should.equal(echoed.textBody, '{"name":"Luke Skywalker"}');
      });
    });

    it('KEY_pre_poll, GET with empty body', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_poll_GET_with_empty_body',
        'movie_pre_poll',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_make_array',
        'movie_post_poll',
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      return _app(input).then((output) => {
        const echoed = output.results[0];
        should.not.exist(echoed.textBody);
      });
    });

    it('KEY_pre_poll, non-ascii URL', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_poll_non_ascii_url',
        'movie_pre_poll',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_make_array',
        'movie_post_poll',
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      return _app(input).then((output) => {
        const result = output.results[0];
        should.equal(result.hello, '你好');
      });
    });

    it('KEY_pre_poll, env in url', () => {
      process.env.SECRET_HTTPBIN_URL = HTTPBIN_URL;

      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_poll_env_var',
        'movie_pre_poll',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_make_array',
        'movie_post_poll',
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );

      return _app(input)
        .then((output) => {
          const result = output.results[0];
          should.equal(result.url, `${HTTPBIN_URL}/get?a=1&a=1&a=2&a=2`);
          should.deepEqual(result.args.a, ['1', '1', '2', '2']);
        })
        .finally(() => {
          delete process.env.SECRET_HTTPBIN_URL;
        });
    });

    it('KEY_pre_poll, double headers with api key auth', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_poll_double_headers',
        'movie_pre_poll',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_make_array',
        'movie_post_poll',
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      input.bundle.authData = {
        api_key: 'one',
      };
      return _app(input).then((output) => {
        const echoed = output.results[0];
        should.deepEqual(echoed.headers['X-Api-Key'], ['three']);
      });
    });

    it('KEY_pre_poll, double headers with session auth', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_poll_double_headers',
        'movie_pre_poll',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_make_array',
        'movie_post_poll',
      );
      const _appDefWithAuth = withAuth(appDef, sessionAuthConfig);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      input.bundle.authData = {
        key1: 'only',
        key2: 'one',
      };
      return _app(input).then((output) => {
        const echoed = output.results[0];
        should.deepEqual(echoed.headers['X-Api-Key'], ['three']);
      });
    });

    it('KEY_pre_poll, StopRequestException', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_poll_stop_request',
        'movie_pre_poll',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_make_array',
        'movie_post_poll',
      );
      const _appDefWithAuth = withAuth(appDef, sessionAuthConfig);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      return _app(input).then((output) => {
        output.results.should.be.an.Array();
        output.results.length.should.equal(0);
      });
    });

    it('KEY_pre_poll, merge query params', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_poll_merge_query_params',
        'movie_pre_poll',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_make_array',
        'movie_post_poll',
      );
      const _appDefWithAuth = withAuth(appDef, sessionAuthConfig);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      return _app(input).then((output) => {
        const echoed = output.results[0];
        should.deepEqual(echoed.args['title[]'], ['null', 'dune', 'eternals']);
      });
    });

    it('KEY_post_poll, jQuery utils', () => {
      const input = createTestInput(
        compiledApp,
        'triggers.contact_post.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
        output.results.length.should.greaterThan(1);

        const firstContact = output.results[0];
        should.equal(firstContact.name, 'Patched by KEY_post_poll!');
        should.equal(firstContact.jqueryText, 'jQuery works!');
        should.equal(firstContact.jqueryParam, 'width=1680&height=1050');
        should.deepEqual(firstContact.randomJson, { hey: 1 });

        should.equal(firstContact.inArray, 3);
        firstContact.isArray.should.be.true();
        firstContact.isEmptyObject.should.be.false();
        firstContact.isFunction.should.be.true();
        firstContact.isNumeric.should.be.true();
        firstContact.isPlainObject.should.be.false();
        should.equal(firstContact.trimmed, 'hello world');
        should.equal(firstContact.type, 'array');
        firstContact.extend.should.deepEqual({ extended: true });

        const secondContact = output.results[1];
        should.equal(firstContact.anotherId, 1000);
        should.equal(secondContact.anotherId, 1001);
      });
    });

    it('KEY_post_poll, jQuery DOM', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'contact_post_post_poll:',
        'contact_post_post_poll_disabled:',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'contact_post_post_poll_jquery_dom',
        'contact_post_post_poll',
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.contact_post.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      return _app(input).then((output) => {
        const contacts = output.results;
        should.equal(contacts.length, 2);

        should.deepEqual(contacts[0], {
          id: 123,
          name: 'Alice',
        });
        should.deepEqual(contacts[1], {
          id: 456,
          name: 'Bob',
        });
      });
    });

    it('KEY_post_poll, no id', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_no_id',
        'movie_post_poll',
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      return _app(input).then((output) => {
        const movies = output.results;
        movies.length.should.greaterThan(1);
        movies.forEach((movie) => {
          should.not.exist(movie.id);
          should.exist(movie.title);
        });
      });
    });

    it('KEY_post_poll, request options from KEY_pre_poll', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_poll_request_options',
        'movie_pre_poll',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_request_options',
        'movie_post_poll',
      );
      const _compiledApp = schemaTools.prepareApp(appDef);
      const _app = createApp(appDef);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      return _app(input).then((output) => {
        const request = output.results[0];
        should.equal(request.method, 'POST');
        should.equal(request.headers.foo, '1234');
        should.equal(request.params.bar, '5678');
        should.equal(request.data, '{"aa":"bb"}');
      });
    });

    it('KEY_post_poll, z.request auth', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_z_request_auth',
        'movie_post_poll',
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      input.bundle.authData = {
        api_key: 'secret',
      };
      return _app(input).then((output) => {
        const movie = output.results[0];
        should.deepEqual(movie.authHeader, ['Bearer secret']);
      });
    });

    it('KEY_pre_poll & KEY_post_poll', () => {
      const input = createTestInput(
        compiledApp,
        'triggers.contact_pre_post.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
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
        'contact_full_post_custom_trigger_fields_disabled',
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.contact_full.operation.outputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return _app(input).then((output) => {
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
        'contact_full_pre_custom_trigger_fields_disabled',
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.contact_full.operation.outputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return _app(input).then((output) => {
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
        'triggers.contact_full.operation.outputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
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

    it("bundle.meta.test_poll being true doesn't imply auth testing", () => {
      // It's an auth test only if test_poll is true AND standard_poll is false
      const input = createTestInput(
        compiledApp,
        'triggers.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.meta = {
        standard_poll: true,
        test_poll: true,
      };
      return app(input).then((output) => {
        const movies = output.results;
        movies.length.should.greaterThan(1);
        should.equal(movies[0].title, 'title 1');
      });
    });

    it('z.dehydrate', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_poll_method_dehydration',
        'movie_post_poll',
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      return _app(input).then((output) => {
        const movies = output.results;
        movies.length.should.greaterThan(1);
        movies.forEach((movie) => {
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
        'movie_post_poll',
      );
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const _app = createApp(_appDefWithAuth);

      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      return _app(input).then((output) => {
        const movies = output.results;
        movies.length.should.greaterThan(1);
        movies.forEach((movie) => {
          movie.trailer.should.startWith('hydrate|||');
          movie.trailer.should.endWith('|||hydrate');

          const payload = JSON.parse(movie.trailer.split('|||')[1]);
          should.equal(payload.type, 'file');
          should.equal(payload.method, 'hydrators.legacyFileHydrator');
          should.equal(payload.bundle.url, `${AUTH_JSON_SERVER_URL}/movies`);
          should.equal(payload.bundle.request.params.id, movie.id);
          should.equal(payload.bundle.meta.name, `movie ${movie.id}.json`);
          should.equal(payload.bundle.meta.length, 1234);
        });
      });
    });

    it('needsFlattenedData trigger', () => {
      if (!nock.isActive()) {
        nock.activate();
      }
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.needsFlattenedData = true;
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      nock(AUTH_JSON_SERVER_URL)
        .get('/movies')
        .reply(200, [
          {
            id: '1',
            title: 'title 1',
            releaseDate: 1471295527,
            genre: 'genre 1',
            cast: ['John Doe', 'Jane Doe'],
            meta: {
              running_time: 120,
              format: 'widescreen',
            },
          },
        ]);
      return app(input).then((output) => {
        // The result from the scripting runner should be flattened
        const expectedResult = {
          id: '1',
          title: 'title 1',
          releaseDate: 1471295527,
          genre: 'genre 1',
          cast: 'John Doe,Jane Doe',
          meta__running_time: 120,
          meta__format: 'widescreen',
        };
        should.deepEqual(output.results[0], expectedResult);
      });
    });

    it('needsEmptyTriggerData', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.needsTriggerData = true;
      const _appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const _compiledApp = schemaTools.prepareApp(_appDefWithAuth);
      const input = createTestInput(
        _compiledApp,
        'triggers.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then(() => {
        should.equal(typeof input.bundle.triggerData, 'object');
        should.equal(Object.keys(input.bundle.triggerData).length, 0);
        should.equal(Array.isArray(input.bundle.triggerData), false);
      });
    });
  });

  describe('hook trigger', () => {
    it('scriptingless', () => {
      const appDef = _.cloneDeep(appDefinition);
      const compiledApp = schemaTools.prepareApp(appDef);
      const app = createApp(appDef);
      const input = createTestInput(
        compiledApp,
        'triggers.contact_hook_scriptingless.operation.perform',
      );
      input.bundle.cleanedRequest = {
        id: 9,
        name: 'Amy',
      };
      return app(input).then((output) => {
        output.results.length.should.equal(1);
        const contact = output.results[0];
        should.deepEqual(contact, {
          id: 9,
          name: 'Amy',
        });
      });
    });

    it('KEY_catch_hook => object', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'contact_hook_scripting_catch_hook_returning_object',
        'contact_hook_scripting_catch_hook',
      );
      const compiledApp = schemaTools.prepareApp(appDef);
      const app = createApp(appDef);
      const input = createTestInput(
        compiledApp,
        'triggers.contact_hook_scripting.operation.perform',
      );
      input.bundle.cleanedRequest = {
        id: 10,
        name: 'Bob',
      };
      return app(input).then((output) => {
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
        'contact_hook_scripting_catch_hook',
      );
      const compiledApp = schemaTools.prepareApp(appDef);
      const app = createApp(appDef);
      const input = createTestInput(
        compiledApp,
        'triggers.contact_hook_scripting.operation.perform',
      );
      input.bundle.cleanedRequest = [
        { id: 11, name: 'Cate' },
        { id: 22, name: 'Dave' },
      ];
      return app(input).then((output) => {
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

    it('KEY_catch_hook, raw request', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'contact_hook_scripting_catch_hook_raw_request',
        'contact_hook_scripting_catch_hook',
      );
      const compiledApp = schemaTools.prepareApp(appDef);
      const app = createApp(appDef);
      const input = createTestInput(
        compiledApp,
        'triggers.contact_hook_scripting.operation.perform',
      );
      input.bundle.rawRequest = {
        headers: {
          'Content-Type': 'application/xml',
          'Http-X-Custom': 'hello',
        },
        content: '<name>Tom</name>',
        querystring: 'foo=bar',
      };
      return app(input).then((output) => {
        const result = output.results[0];
        should.equal(result.headers['Content-Type'], 'application/xml');
        should.equal(result.headers['Http-X-Custom'], 'hello');
        should.equal(result.content, '<name>Tom</name>');
        should.equal(result.querystring, 'foo=bar');
      });
    });

    it('KEY_catch_hook, StopRequestException', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'contact_hook_scripting_catch_hook_stop_request',
        'contact_hook_scripting_catch_hook',
      );
      const compiledApp = schemaTools.prepareApp(appDef);
      const app = createApp(appDef);
      const input = createTestInput(
        compiledApp,
        'triggers.contact_hook_scripting.operation.perform',
      );
      return app(input).then((output) => {
        should.deepEqual(output.results, []);
      });
    });

    it('REST Hook should ignore KEY_pre_hook', () => {
      // Not a Notication REST hook, KEY_pre_hook should be ignored
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'contact_hook_scripting_catch_hook_returning_object',
        'contact_hook_scripting_catch_hook',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'contact_hook_scripting_pre_hook_disabled',
        'contact_hook_scripting_pre_hook',
      );
      const appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'triggers.contact_hook_scripting.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.cleanedRequest = {
        id: 3,
        name: 'Eric',
        resource_url: 'https://dont.care',
      };
      return app(input).then((output) => {
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
        'contact_hook_scripting_catch_hook',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'contact_hook_scripting_pre_hook_disabled',
        'contact_hook_scripting_pre_hook',
      );
      const appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'triggers.contact_hook_scripting.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.cleanedRequest = {
        id: 3,
        name: 'Eric',
      };
      return app(input).then((output) => {
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
        'contact_hook_scripting_pre_hook',
      );
      const appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'triggers.contact_hook_scripting.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.cleanedRequest = {
        id: 3,
        name: 'Dont Care',
        resource_url: `${AUTH_JSON_SERVER_URL}/users/3`,
      };
      return app(input).then((output) => {
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
        'contact_hook_scripting_post_hook',
      );
      const appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'triggers.contact_hook_scripting.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.cleanedRequest = {
        id: 3,
        name: 'Dont Care',
        resource_url: `${AUTH_JSON_SERVER_URL}/users/3`,
      };
      return app(input).then((output) => {
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
        'contact_hook_scripting_post_hook',
      );
      const appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'triggers.contact_hook_scripting.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.cleanedRequest = {
        id: 3,
        name: 'Dont Care',
        resource_url: `${AUTH_JSON_SERVER_URL}/users/3`,
      };
      return app(input).then((output) => {
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
        'contact_hook_scripting_pre_hook',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'contact_hook_scripting_post_hook_returning_object',
        'contact_hook_scripting_post_hook',
      );
      const appDefWithAuth = withAuth(appDef, apiKeyAuth);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'triggers.contact_hook_scripting.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.cleanedRequest = {
        id: 3,
        name: 'Dont Care',
        resource_url: `${AUTH_JSON_SERVER_URL}/users/3`,
      };
      return app(input).then((output) => {
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
        'triggers.contact_hook_scripting.operation.performSubscribe',
      );
      input.bundle.authData = { api_key: 'hey hey' };
      input.bundle.inputData = { foo: 'bar' };
      input.bundle.targetUrl = 'https://foo.bar';
      input.bundle.meta = { zap: { id: 9511 } };

      return app(input).then((output) => {
        should.equal(output.results.json.event, 'contact.created');
        should.equal(
          output.results.json.hidden_message,
          'pre_subscribe was here!',
        );
        should.equal(output.results.headers['X-Api-Key'], 'hey hey');
        should.equal(output.results.hiddenMessage, 'post_subscribe was here!');

        should.deepEqual(output.results.json.bundleTriggerData, {
          foo: 'bar',
        });
        should.deepEqual(output.results.bundleTriggerData2, {
          foo: 'bar',
        });
        should.deepEqual(output.results.json.bundleAuthFields, {
          api_key: 'hey hey',
        });
        should.deepEqual(output.results.json.bundleTriggerFields, {
          foo: 'bar',
        });
        should.equal(output.results.json.bundleTargetUrl, 'https://foo.bar');
        should.equal(output.results.json.bundleEvent, 'contact.created');
        should.deepEqual(output.results.json.bundleZap, { id: 9511 });
        should.equal(
          output.results.json.bundleSubscriptionUrl,
          'https://foo.bar',
        );
      });
    });

    it('pre_unsubscribe', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'triggers.contact_hook_scripting.operation.performUnsubscribe',
      );
      input.bundle.authData = { api_key: 'yo yo' };
      input.bundle.inputData = { foo: 'bar', subscription_id: 8866 };
      input.bundle.targetUrl = 'https://foo.bar';
      input.bundle.subscribeData = { subscription_id: 7744 };
      input.bundle.meta = { zap: { id: 9512 } };
      return app(input).then((output) => {
        should.equal(output.results.request.method, 'DELETE');

        const echoed = output.results.json;
        should.equal(echoed.args.sub_id, '7744');
        should.equal(echoed.json.event, 'contact.created');
        should.equal(echoed.json.hidden_message, 'pre_unsubscribe was here!');
        should.equal(echoed.headers['X-Api-Key'], 'yo yo');

        should.deepEqual(echoed.json.bundleAuthFields, { api_key: 'yo yo' });
        should.deepEqual(echoed.json.bundleTriggerFields, {
          foo: 'bar',
          subscription_id: 8866,
        });
        should.equal(echoed.json.bundleTargetUrl, 'https://foo.bar');
        should.equal(echoed.json.bundleEvent, 'contact.created');
        should.deepEqual(echoed.json.bundleZap, { id: 9512 });
        should.equal(echoed.json.bundleSubscriptionUrl, 'https://foo.bar');
      });
    });
  });

  describe('create', () => {
    it('handleLegacyParams action', () => {
      if (!nock.isActive()) {
        nock.activate();
      }
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.creates.movie.operation.url += 's';
      appDefWithAuth.legacy.needsFlattenedData = true;

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'title 1',
        releaseDate: 1471295527,
        genre: 'genre 1',
        cast: ['John Doe', 'Jane Doe'],
        meta: {
          running_time: 120,
          format: 'widescreen',
        },
      };
      input.bundle.authData = { api_key: 'secret' };
      // title key is removed deliberately for other tests
      nock(AUTH_JSON_SERVER_URL)
        .post('/movies', {
          releaseDate: 1471295527,
          genre: 'genre 1',
          cast: 'John Doe,Jane Doe',
          meta: 'running_time|120\nformat|widescreen',
        })
        .reply(200, { id: 'abcd1234' });
      return app(input).then(() => {
        // we only care that the mocked api call had the right format payload
      });
    });

    it('scriptingless perform', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.creates.movie.operation.url += 's';

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'It',
        genre: 'Horror',
      };
      return app(input).then((output) => {
        const movie = output.results;
        should.exist(movie.id);
        should.not.exist(movie.title);
        should.equal(movie.genre, 'Horror');
      });
    });

    it('scriptingless perform, session auth', () => {
      const appDefWithAuth = withAuth(appDefinition, sessionAuthConfig);
      appDefWithAuth.legacy.creates.movie.operation.url = `${HTTPBIN_URL}/post`;
      appDefWithAuth.legacy.authentication.mapping['content-type'] =
        'hello/world';

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.authData = { key1: 'sec', key2: 'ret' };
      return app(input).then((output) => {
        const echoed = output.results;
        // Only one content-type header should be sent
        should.deepEqual(echoed.headers['Content-Type'], [
          'application/json; charset=utf-8',
        ]);
      });
    });

    it('scriptingless perform, curlies in URL', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      const legacyProps = appDefWithAuth.legacy.creates.movie.operation;
      legacyProps.url = legacyProps.url.replace(
        '/movie',
        '/{{bundle.inputData.resource_name}}',
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'The Dark Knight',
        genre: 'Drama',
        resource_name: 'movies',
      };
      return app(input).then((output) => {
        const movie = output.results;
        should.exist(movie.id);
        should.not.exist(movie.title);
        should.equal(movie.genre, 'Drama');
      });
    });

    it('scriptingless perform, array of strings', () => {
      if (!nock.isActive()) {
        nock.activate();
      }
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.creates.movie.operation.url += 's';

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.inputData = {
        title: 'Men in Black',
      };
      nock(AUTH_JSON_SERVER_URL).post('/movies').reply(200, ['foo', 'bar']);
      return app(input).then((output) => {
        should.deepEqual(output.results, { message: 'foo' });
      });
    });

    it('KEY_pre_write', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_write_disabled',
          'movie_pre_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'The Shape of Water',
        genre: 'Fantasy',
      };
      return app(input).then((output) => {
        const movie = output.results;
        should.exist(movie.id);
        should.equal(movie.title, 'The Shape of Water');
        should.equal(movie.genre, 'Fantasy');
      });
    });

    it('KEY_pre_write, unflatten data', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_write_unflatten',
          'movie_pre_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        meta__title: 'The Shape of Water',
        meta__genre: 'Fantasy',
      };
      input.bundle.inputDataRaw = {
        meta__title: '{{123__title}}',
        meta__genre: '{{234__genre}}',
      };
      return app(input).then((output) => {
        const echoed = output.results.json;
        should.deepEqual(echoed.action_fields, {
          meta: {
            title: 'The Shape of Water',
            genre: 'Fantasy',
          },
        });
        should.deepEqual(echoed.action_fields_full, {
          meta__title: 'The Shape of Water',
          meta__genre: 'Fantasy',
        });
        should.deepEqual(echoed.action_fields_raw, {
          meta__title: '{{123__title}}',
          meta__genre: '{{234__genre}}',
        });
        should.deepEqual(echoed.orig_data, {
          meta: {
            title: 'The Shape of Water',
            genre: 'Fantasy',
          },
        });
      });
    });

    it('KEY_pre_write, bundle.action_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_write_unflatten',
          'movie_pre_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'The Shape of Water',
      };
      input.bundle.inputDataRaw = {
        title: '{{123__title}}',
      };
      return app(input).then((output) => {
        const echoed = output.results.json;

        // Doesn't have 'title' because it's in fieldsExcludedFromBody
        should.deepEqual(echoed.action_fields, {});
        should.deepEqual(echoed.action_fields_full, {
          title: 'The Shape of Water',
        });
        should.deepEqual(echoed.action_fields_raw, {
          title: '{{123__title}}',
        });
        should.deepEqual(echoed.orig_data, {});
      });
    });

    it('KEY_pre_write, default headers', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_write_default_headers',
        'movie_pre_write',
      );
      const compiledApp = schemaTools.prepareApp(appDef);
      const app = createApp(appDef);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      return app(input).then((output) => {
        const echoed = output.results;
        should.equal(echoed.headers.Accept[0], 'application/json');
        should.equal(
          echoed.headers['Content-Type'][0],
          'application/json; charset=utf-8',
        );
        should.equal(echoed.json.accept, 'application/json');
        should.equal(
          echoed.json.contentType,
          'application/json; charset=utf-8',
        );
      });
    });

    it('KEY_pre_write, _.template(bundle.url_raw)', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'recipe_pre_write_underscore_template',
          'recipe_pre_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.recipe.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        urlPath: '/recipes',
        name: 'Egg & Cheese',
      };
      return app(input).then((output) => {
        const recipe = output.results;
        should.exist(recipe.id);
        should.equal(recipe.name, 'Egg & Cheese');
      });
    });

    it('KEY_pre_write, request fallback', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_write_request_fallback',
          'movie_pre_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'IT 2',
        genre: 'Horror',
        year: 2019,
      };
      return app(input).then((output) => {
        const movie = output.results;
        should.exist(movie.id);
        should.not.exist(movie.title); // title is in fieldsExcludedFromBody
        should.equal(movie.genre, 'Horror');
        should.equal(movie.year, 2019);
      });
    });

    it('KEY_pre_write, no content', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_write_no_content',
          'movie_pre_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      return app(input).then((output) => {
        should.deepEqual(output.results, {});
      });
    });

    it('KEY_pre_write, request.data is an empty string', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_write_request_data_empty_string',
          'movie_pre_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      return app(input).then((output) => {
        const echoed = output.results;
        should.equal(echoed.textBody, '');
      });
    });

    it('KEY_pre_write, prune empty params', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_write_prune_empty_params',
          'movie_pre_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      return app(input).then((output) => {
        const echoed = output.results;
        should.deepEqual(echoed.args, {
          foo: [''],
          bar: ['', 'None'],
          baz: [''],
          banana: ['None'],
        });
      });
    });

    it('KEY_pre_write, data is object', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_write_data_is_object',
          'movie_pre_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      return app(input).then((output) => {
        const echoed = output.results;
        should.equal(
          echoed.headers['content-type'],
          'application/json; charset=utf-8',
        );
        should.equal(
          echoed.textBody,
          'foo=bar&apple=123&dragonfruit=%26%3D&eggplant=1.11&eggplant=2.22&' +
            'filbert=True&nest=foo&nest=hello',
        );
      });
    });

    it('KEY_pre_write, StopRequestException', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_write_stop_request',
          'movie_pre_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      return app(input).then((output) => {
        should.deepEqual(output.results, {});
      });
    });

    it('KEY_post_write', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.creates.movie.operation.url += 's';
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_write_disabled',
          'movie_post_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'Get Out',
        genre: 'Comedy',
      };
      return app(input).then((output) => {
        const movie = output.results;
        should.exist(movie.id);
        should.not.exist(movie.title);
        should.equal(movie.genre, 'Comedy');
        should.equal(movie.year, 2017);
      });
    });

    it('KEY_post_write, sloppy mode', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.creates.movie.operation.url += 's';
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_write_sloppy_mode',
          'movie_post_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'First Man',
        genre: 'Drama',
      };
      return app(input).then((output) => {
        const movie = output.results;
        should.exist(movie.id);
        should.not.exist(movie.title);
        should.equal(movie.genre, 'Drama');
        should.equal(movie.year, 2018);
      });
    });

    it('KEY_post_write, strict mode', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.creates.movie.operation.url += 's';
      appDefWithAuth.legacy.scriptingSource =
        'use strict;\n' + appDefWithAuth.legacy.scriptingSource;
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_write_sloppy_mode',
          'movie_post_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'First Man',
        genre: 'Drama',
      };
      return app(input).should.be.rejectedWith(/Unexpected identifier/);
    });

    it('KEY_post_write, require()', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.creates.movie.operation.url += 's';
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_write_require',
          'movie_post_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
        const movie = output.results;
        should.equal(movie.title, 'Joker');
        should.equal(movie.year, 2019);
      });
    });

    it('KEY_post_write, returning nothing', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.creates.movie.operation.url += 's';
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_write_returning_nothing',
          'movie_post_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'The Rise of Skywalker',
        genre: 'Sci-fi',
      };
      return app(input).then((output) => {
        should.deepEqual(output.results, {});
      });
    });

    it('KEY_post_write, returning string', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.creates.movie.operation.url += 's';
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_write_returning_string',
          'movie_post_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'Us',
        genre: 'Horror',
      };
      return app(input).then((output) => {
        should.deepEqual(output.results, { message: 'ok' });
      });
    });

    it('KEY_post_write, intercept error', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_write_intercept_error',
        'movie_pre_write',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_write_intercept_error',
        'movie_post_write',
      );
      const compiledApp = schemaTools.prepareApp(appDef);
      const app = createApp(appDef);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      return app(input).should.be.rejectedWith(
        /teapot here, go find a coffee machine/,
      );
    });

    it('KEY_post_write, response error overrules script error', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_pre_write_intercept_error',
        'movie_pre_write',
      );
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_post_write_bad_code',
        'movie_post_write',
      );
      const compiledApp = schemaTools.prepareApp(appDef);
      const app = createApp(appDef);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      return app(input).should.be.rejectedWith(/I'm a teapot/);
    });

    it('KEY_pre_write & KEY_post_write', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_write_disabled',
          'movie_pre_write',
        );
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_write_disabled',
          'movie_post_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'Phantom Thread',
        genre: 'Drama',
      };
      return app(input).then((output) => {
        const movie = output.results;
        should.exist(movie.id);
        should.equal(movie.title, 'Phantom Thread');
        should.equal(movie.genre, 'Drama');
        should.equal(movie.year, 2017);

        // pre_write bundle log, http log, post_write bundle log
        should.equal(logs.length, 3);

        logs[0].should.containDeep({
          message: 'Called legacy scripting movie_pre_write',
          log_type: 'bundle',
          input: {
            auth_fields: {
              api_key: 'secret',
            },
            action_fields_full: {
              title: 'Phantom Thread',
              genre: 'Drama',
            },
            request: {
              url: `${AUTH_JSON_SERVER_URL}/movie`,
              method: 'POST',
              data: '{"genre":"Drama"}',
            },
          },
          output: {
            url: `${AUTH_JSON_SERVER_URL}/movies`,
            method: 'POST',
            data: '{"title":"Phantom Thread","genre":"Drama"}',
          },
        });

        logs[1].should.containDeep({
          message: `201 POST ${AUTH_JSON_SERVER_URL}/movies`,
          log_type: 'http',
          request_url: `${AUTH_JSON_SERVER_URL}/movies`,
          request_method: 'POST',
          request_headers: {
            'X-Api-Key': 'secret',
          },
          response_status_code: 201,
        });

        let loggedResponseData = JSON.parse(logs[1].response_content);
        loggedResponseData.should.containEql({
          title: 'Phantom Thread',
          genre: 'Drama',
        });

        logs[2].should.containDeep({
          message: 'Called legacy scripting movie_post_write',
          log_type: 'bundle',
          input: {
            response: {
              status_code: 201,
            },
          },
          output: {
            title: 'Phantom Thread',
            genre: 'Drama',
            year: 2017,
          },
        });

        loggedResponseData = JSON.parse(logs[2].input.response.content);
        loggedResponseData.should.containEql({
          title: 'Phantom Thread',
          genre: 'Drama',
        });
      });
    });

    it('async KEY_write', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_write_async',
          'movie_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'Room',
        genre: 'Drama',
      };
      return app(input).then((output) => {
        const movie = output.results;
        should.exist(movie.id);
        should.equal(movie.title, 'Room');
        should.equal(movie.genre, 'Drama');
        should.equal(movie.year, 2015);

        // http log and bundle log
        should.equal(logs.length, 2);

        logs[0].should.containDeep({
          message: `201 POST ${AUTH_JSON_SERVER_URL}/movies`,
          log_type: 'http',
          request_url: `${AUTH_JSON_SERVER_URL}/movies`,
          request_method: 'POST',
          response_status_code: 201,
        });

        const loggedResponseData = JSON.parse(logs[0].response_content);
        loggedResponseData.should.containEql({
          title: 'Room',
          genre: 'Drama',
        });

        logs[1].should.containDeep({
          message: 'Called legacy scripting movie_write',
          log_type: 'bundle',
          input: {
            request: {
              url: `${AUTH_JSON_SERVER_URL}/movie`,
              method: 'POST',
              data: '{"genre":"Drama"}',
            },
          },
          output: {
            title: 'Room',
            genre: 'Drama',
            year: 2015,
          },
        });
      });
    });

    it('sync KEY_write', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_write_sync',
          'movie_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'Arrival',
        genre: 'Sci-fi',
      };
      return app(input).then((output) => {
        const movie = output.results;
        should.exist(movie.id);
        should.equal(movie.title, 'Arrival');
        should.equal(movie.genre, 'Sci-fi');
        should.equal(movie.year, 2016);
      });
    });

    it('sync KEY_write empty list', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_write_sync',
          'movie_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = [];

      return app(input).then((output) => {
        should.deepEqual(output.results, {});
      });
    });

    it('sync KEY_write primitive', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_write_sync',
          'movie_write',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = [1234];

      return app(input).then((output) => {
        should.deepEqual(output.results, { message: 1234 });
      });
    });

    it('sync KEY_write, curlies in URL', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_write_sync',
          'movie_write',
        );
      const legacyProps = appDefWithAuth.legacy.creates.movie.operation;
      legacyProps.url = legacyProps.url.replace(
        '/movie',
        '/{{bundle.inputData.resource_name}}',
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        title: 'La La Land',
        genre: 'Musical',
        resource_name: 'movie',
      };
      return app(input).then((output) => {
        const movie = output.results;
        should.exist(movie.id);
        should.equal(movie.title, 'La La Land');
        should.equal(movie.genre, 'Musical');
        should.equal(movie.year, 2016);
      });
    });

    it('KEY_write, default headers', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_write_default_headers',
        'movie_write',
      );
      const compiledApp = schemaTools.prepareApp(appDef);
      const app = createApp(appDef);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      return app(input).then((output) => {
        const echoed = output.results;
        should.equal(echoed.headers.Accept[0], 'application/json');
        should.equal(
          echoed.headers['Content-Type'][0],
          'application/json; charset=utf-8',
        );
        should.equal(echoed.json.accept, 'application/json');
        should.equal(
          echoed.json.contentType,
          'application/json; charset=utf-8',
        );
      });
    });

    it('KEY_write, z.request({ json: true })', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_write_json_true',
        'movie_write',
      );
      const compiledApp = schemaTools.prepareApp(appDef);
      const app = createApp(appDef);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      return app(input).then((output) => {
        const echoed = output.results;
        should.equal(echoed.json.hello, 'world');
      });
    });

    it('KEY_write, StopRequestException', () => {
      const appDef = _.cloneDeep(appDefinition);
      appDef.legacy.scriptingSource = appDef.legacy.scriptingSource.replace(
        'movie_write_stop_request',
        'movie_write',
      );
      const compiledApp = schemaTools.prepareApp(appDef);
      const app = createApp(appDef);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.perform',
      );
      return app(input).then((output) => {
        should.deepEqual(output.results, {});
      });
    });

    it('scriptingless input fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.creates.movie.operation.inputFieldsUrl += 's';

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.inputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
        const fields = output.results;
        should.equal(fields.length, 3);
        should.equal(fields[0].key, 'title');
        should.equal(fields[1].key, 'genre');
        should.equal(fields[2].key, 'luckyNumber');
      });
    });

    it('KEY_pre_custom_action_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_custom_action_fields_disabled',
          'movie_pre_custom_action_fields',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.inputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
        const fields = output.results;
        should.equal(fields.length, 3);
        should.equal(fields[0].key, 'title');
        should.equal(fields[1].key, 'genre');
        should.equal(fields[2].key, 'luckyNumber');
      });
    });

    it('KEY_pre_custom_action_fields, empty request.data', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_custom_action_fields_empty_request_data',
          'movie_pre_custom_action_fields',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.inputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
        const fields = output.results;
        should.equal(fields.length, 3);
        should.equal(fields[0].key, 'title');
        should.equal(fields[1].key, 'genre');
        should.equal(fields[2].key, 'luckyNumber');
      });
    });

    it('KEY_pre_custom_action_fields, _.template(bundle.raw_url)', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'recipe_pre_custom_action_fields_underscore_template',
          'recipe_pre_custom_action_fields',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.recipe.operation.inputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        urlPath: '/input-fields',
      };
      return app(input).then((output) => {
        const fields = output.results;
        should.equal(fields.length, 3);
        should.equal(fields[0].key, 'name');
        should.equal(fields[1].key, 'directions');
        should.equal(fields[2].key, 'luckyNumber');
      });
    });

    it('KEY_post_custom_action_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.creates.movie.operation.inputFieldsUrl += 's';
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_custom_action_fields_disabled',
          'movie_post_custom_action_fields',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.inputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
        const fields = output.results;
        should.equal(fields.length, 4);
        should.equal(fields[0].key, 'title');
        should.equal(fields[1].key, 'genre');
        should.equal(fields[2].key, 'luckyNumber');
        should.equal(fields[3].key, 'year');
        should.equal(fields[3].type, 'integer');
      });
    });

    it('KEY_post_custom_action_fields, dict field', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.creates.movie.operation.inputFieldsUrl += 's';
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_custom_action_fields_dict_field',
          'movie_post_custom_action_fields',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.inputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
        const fields = output.results;
        should.equal(fields.length, 4);
        should.equal(fields[3].key, 'attrs');
        should.equal(fields[3].type, 'string');
        should.not.exist(fields[3].list);
        fields[3].dict.should.be.true();
      });
    });

    it('KEY_post_custom_action_fields, returning nothing', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.creates.movie.operation.inputFieldsUrl += 's';
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_custom_action_fields_returning_nothing',
          'movie_post_custom_action_fields',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.inputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
        const fields = output.results;
        should.equal(fields.length, 2);
        should.equal(fields[0].key, 'title');
        should.equal(fields[1].key, 'genre');
      });
    });

    it('KEY_pre_custom_action_fields & KEY_post_custom_action_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_custom_action_fields_disabled',
          'movie_pre_custom_action_fields',
        );
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_custom_action_fields_disabled',
          'movie_post_custom_action_fields',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.inputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
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
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_custom_action_fields_disabled',
          'movie_custom_action_fields',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.inputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
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
        'creates.movie.operation.outputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
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
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_custom_action_result_fields_disabled',
          'movie_pre_custom_action_result_fields',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.outputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
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
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_custom_action_result_fields_disabled',
          'movie_post_custom_action_result_fields',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.outputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
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
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_custom_action_result_fields_disabled',
          'movie_pre_custom_action_result_fields',
        );
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_custom_action_result_fields_disabled',
          'movie_post_custom_action_result_fields',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.outputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
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
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_custom_action_result_fields_disabled',
          'movie_custom_action_result_fields',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.movie.operation.outputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
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
        'creates.file.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'this is a pig.png',
        // In reality, file will always be a "hydrate URL" that looks something
        // like https://zapier.com/engine/hydrate/1/abcd/, but in fact any
        // valid URL would work.
        file: `${HTTPBIN_URL}/image/png`,
      };
      return app(input).then((output) => {
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
        'creates.file.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'this is a pig.png',
        file: `${HTTPBIN_URL}/redirect-to?url=/image/png`,
      };
      return app(input).then((output) => {
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
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'file_pre_write_tweak_filename',
          'file_pre_write',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'this is a pig.png',
        file: `${HTTPBIN_URL}/image/png`,
      };
      return app(input).then((output) => {
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
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'file_pre_write_replace_hydrate_url',
          'file_pre_write',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'this is a wolf.jpg',
        file: `${HTTPBIN_URL}/image/jpeg`,
      };
      return app(input).then((output) => {
        const file = output.results.file;
        should.equal(file.sha1, 'eb1db8fa7b8277f2de5d7b40d6cdbc708aac4e52');
        should.equal(file.mimetype, 'image/jpeg');
        should.equal(file.originalname, 'file_pre_write_was_here.jpeg');

        const data = JSON.parse(output.results.data);
        should.equal(data.filename, 'this is a wolf.jpg');
      });
    });

    it('file upload, KEY_pre_write replaces with string content', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'file_pre_write_replace_with_string_content',
          'file_pre_write',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'dont.care',
        file: `${HTTPBIN_URL}/image/png`,
      };
      return app(input).then((output) => {
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
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'file_pre_write_fully_replace_url',
          'file_pre_write',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'dont.care',
        file: `${HTTPBIN_URL}/image/png`,
      };
      return app(input).then((output) => {
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
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'file_pre_write_fully_replace_content',
          'file_pre_write',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'dont.care',
        file: `${HTTPBIN_URL}/image/png`,
      };
      return app(input).then((output) => {
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
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'file_pre_write_content_dispoistion_with_quotes',
          'file_pre_write',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'dont.care',
        file: `${HTTPBIN_URL}/image/png`,
      };
      return app(input).then((output) => {
        const file = output.results.file;
        should.equal(file.sha1, '04bc9f090eafc29a4ab29b05f0f306365b017857');
        should.equal(file.mimetype, 'application/json');
        should.equal(file.originalname, 'an example.json');

        const data = JSON.parse(output.results.data);
        should.equal(data.filename, 'dont.care');
      });
    });

    it('file upload, KEY_pre_write, content disposition without quotes', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'file_pre_write_content_dispoistion_no_quotes',
          'file_pre_write',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'dont.care',
        file: `${HTTPBIN_URL}/image/png`,
      };
      return app(input).then((output) => {
        const file = output.results.file;
        should.equal(file.sha1, 'ebad26f071d502f26ea7afccea320195c1ad7e8e');
        should.equal(file.mimetype, 'application/json');
        should.equal(file.originalname, 'example.json');

        const data = JSON.parse(output.results.data);
        should.equal(data.filename, 'dont.care');
      });
    });

    it('file upload, KEY_pre_write, content disposition non-ascii', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'file_pre_write_content_dispoistion_non_ascii',
          'file_pre_write',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'dont.care',
        file: `${HTTPBIN_URL}/image/png`,
      };
      return app(input).then((output) => {
        const file = output.results.file;
        should.equal(file.sha1, 'd7bd9d0e663a001291d1536715403744cbff054d');
        should.equal(file.mimetype, 'application/json');
        should.equal(file.originalname, '中文.json');

        const data = JSON.parse(output.results.data);
        should.equal(data.filename, 'dont.care');
      });
    });

    it('file upload, KEY_pre_write, wrong content type', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'file_pre_write_wrong_content_type',
          'file_pre_write',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'dont.care',
        file: `${HTTPBIN_URL}/image/png`,
      };
      return app(input).then((output) => {
        const file = output.results.file;
        should.equal(file.sha1, '379f5137831350c900e757b39e525b9db1426d53');

        const filename = output.results.filename;
        should.equal(filename, 'dont.care');
      });
    });

    it('file upload, KEY_pre_write, rename file field', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'file2_pre_write_rename_file_field',
          'file2_pre_write',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file2.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        id: 'whatever',
        name: 'a pig',
        file_1: `${HTTPBIN_URL}/image/png`,
      };
      return app(input).then((output) => {
        const file = output.results.file;
        should.equal(file.sha1, '379f5137831350c900e757b39e525b9db1426d53');

        const data = JSON.parse(output.results.data);
        should.equal(data.id, 'whatever');
        should.equal(data.name, 'a pig');
      });
    });

    it('file upload, KEY_pre_write, optional file field is empty', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'file_pre_write_optional_file_field',
          'file_pre_write',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'pig.png',
      };
      return app(input).then((output) => {
        const echoed = output.results;
        should.equal(echoed.headers['Content-Type'], 'application/json');
        should.deepEqual(echoed.json, { filename: 'pig.png' });
      });
    });

    it('file upload, KEY_pre_write, optional file field is filled', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'file_pre_write_optional_file_field',
          'file_pre_write',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'pig.png',
        file: `${HTTPBIN_URL}/robots.txt`,
        yes: true,
      };
      return app(input).then((output) => {
        const response = output.results;
        const file = response.file;
        should.equal(response.filename, 'pig.png');
        should.equal(response.yes, 'True');
        should.equal(file.sha1, '4becbe4770c949a40cb28f9d1c2b4910fbf7e37d');
      });
    });

    it('file upload, KEY_pre_write, cancel multipart', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'file_pre_write_cancel_multipart',
          'file_pre_write',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'creates.file.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        filename: 'pig.png',
        file: `${HTTPBIN_URL}/image/png`,
        yes: true,
      };
      return app(input).then((output) => {
        const response = output.results;

        const contentType = response.headers['Content-Type'][0];
        contentType.should.startWith('application/json');

        const json = response.json;
        should.deepEqual(json.file, [
          'png',
          `${HTTPBIN_URL}/image/png`,
          'image/png',
        ]);
        should.equal(json.filename, 'pig.png');
        should.equal(json.yes, true);
      });
    });

    describe('legacyMethodHydrator', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      it('should get data if auth is correct', () => {
        const input = createTestInput(
          compiledApp,
          'hydrators.legacyMethodHydrator',
        );
        input.bundle.authData = { api_key: 'secret' };
        input.bundle.inputData = {
          method: 'getUser',
          bundle: {
            userId: 3,
          },
        };
        return app(input).then((output) => {
          const user = output.results;
          should.equal(user.id, 3);
          should.equal(user.name, 'Clementine Bauch');
        });
      });

      it('should fail if bad auth', () => {
        const input = createTestInput(
          compiledApp,
          'hydrators.legacyMethodHydrator',
        );
        input.bundle.authData = { api_key: 'bad key' };
        input.bundle.inputData = {
          method: 'getUser',
          bundle: {
            userId: 3,
          },
        };
        return app(input).should.be.rejectedWith(/Unauthorized/);
      });

      it('should fail if no auth', () => {
        const input = createTestInput(
          compiledApp,
          'hydrators.legacyMethodHydrator',
        );
        input.bundle.inputData = {
          method: 'getUser',
          bundle: {
            userId: 3,
          },
        };
        return app(input).should.be.rejectedWith(/Unauthorized/);
      });
    });

    describe('legacyFileHydrator', () => {
      const mockFileStahser = (input) => {
        // Mock z.stashFile to do nothing but return file content and meta
        input.z.stashFile = async (
          filePromise,
          knownLength,
          filename,
          contentType,
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
            contentType,
          };
        };
        return input;
      };

      it('should send auth when no request options', () => {
        const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
        const compiledApp = schemaTools.prepareApp(appDefWithAuth);
        const app = createAppWithCustomBefores(appDefWithAuth, [
          mockFileStahser,
        ]);

        const input = createTestInput(
          compiledApp,
          'hydrators.legacyFileHydrator',
        );
        input.bundle.authData = { api_key: 'super secret' };
        input.bundle.inputData = {
          // This endpoint echoes what we send to it, so we know if auth info was sent
          url: `${HTTPBIN_URL}/get`,
        };
        return app(input).then((output) => {
          const { response, content, knownLength, filename, contentType } =
            output.results;
          should.deepEqual(content.headers['X-Api-Key'], ['super secret']);
          should.not.exist(knownLength);
          should.not.exist(filename);
          should.not.exist(contentType);

          // Make sure prepareResponse middleware was run
          response.getHeader.should.be.Function();
          should.equal(
            response.getHeader('content-type'),
            'application/json; encoding=utf-8',
          );
        });
      });

      it('should not send auth when empty request options', () => {
        const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
        const compiledApp = schemaTools.prepareApp(appDefWithAuth);
        const app = createAppWithCustomBefores(appDefWithAuth, [
          mockFileStahser,
        ]);

        const input = createTestInput(
          compiledApp,
          'hydrators.legacyFileHydrator',
        );
        input.bundle.authData = { api_key: 'super secret' };
        input.bundle.inputData = {
          // This endpoint echoes what we send to it, so we know if auth info was sent
          url: `${HTTPBIN_URL}/get`,
          // An empty object should behave differently than an undefined request.
          // An undefined request doesn't clear auth while an empty object does.
          request: {},
        };
        return app(input).then((output) => {
          const { response, content, knownLength, filename, contentType } =
            output.results;
          should.not.exist(content.headers['X-Api-Key']);
          should.not.exist(knownLength);
          should.not.exist(filename);
          should.not.exist(contentType);

          // Make sure prepareResponse middleware was run
          response.getHeader.should.be.Function();
          should.equal(
            response.getHeader('content-type'),
            'application/json; encoding=utf-8',
          );
        });
      });

      it('should not send auth when request options are present', () => {
        const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
        const compiledApp = schemaTools.prepareApp(appDefWithAuth);
        const app = createAppWithCustomBefores(appDefWithAuth, [
          mockFileStahser,
        ]);

        const input = createTestInput(
          compiledApp,
          'hydrators.legacyFileHydrator',
        );
        input.bundle.authData = { api_key: 'super secret' };
        input.bundle.inputData = {
          // This endpoint echoes what we send to it, so we know if auth info was sent
          url: `${HTTPBIN_URL}/get`,
          request: {
            params: { foo: 1, bar: 'hello' },
          },
        };
        return app(input).then((output) => {
          const { response, content, knownLength, filename, contentType } =
            output.results;

          should.equal(content.args.foo, '1');
          should.equal(content.args.bar, 'hello');
          should.not.exist(content.headers['X-Api-Key']);
          should.not.exist(knownLength);
          should.not.exist(filename);
          should.not.exist(contentType);

          // Make sure prepareResponse middleware was run
          response.getHeader.should.be.Function();
          should.equal(
            response.getHeader('content-type'),
            'application/json; encoding=utf-8',
          );
        });
      });

      it('should send file meta', () => {
        const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
        const compiledApp = schemaTools.prepareApp(appDefWithAuth);
        const app = createAppWithCustomBefores(appDefWithAuth, [
          mockFileStahser,
        ]);

        const input = createTestInput(
          compiledApp,
          'hydrators.legacyFileHydrator',
        );
        input.bundle.authData = { api_key: 'super secret' };
        input.bundle.inputData = {
          // This endpoint echoes what we send to it, so we know if auth info was sent
          url: `${HTTPBIN_URL}/get`,
          request: {
            params: { foo: 1, bar: 'hello' },
          },
          meta: {
            length: 1234,
            name: 'hello.json',
          },
        };
        return app(input).then((output) => {
          const { response, content, knownLength, filename, contentType } =
            output.results;

          should.equal(content.args.foo, '1');
          should.equal(content.args.bar, 'hello');
          should.not.exist(content.headers['X-Api-Key']);
          should.equal(knownLength, 1234);
          should.equal(filename, 'hello.json');
          should.not.exist(contentType);

          // Make sure prepareResponse middleware was run
          response.getHeader.should.be.Function();
          should.equal(
            response.getHeader('content-type'),
            'application/json; encoding=utf-8',
          );
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
        'searches.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        query: 'title 10',
      };
      return app(input).then((output) => {
        output.results.length.should.equal(1);

        const movie = output.results[0];
        should.equal(movie.id, 10);
        should.equal(movie.title, 'title 10');
      });
    });

    it('KEY_pre_search', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_search_disabled',
          'movie_pre_search',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        query: 'title 20',
      };
      return app(input).then((output) => {
        output.results.length.should.equal(1);

        const movie = output.results[0];
        should.equal(movie.id, 20);
        should.equal(movie.title, 'title 20');
      });
    });

    it('KEY_pre_search, StopRequestException', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_search_stop_request',
          'movie_pre_search',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.perform',
      );
      return app(input).then((output) => {
        should.deepEqual(output.results, []);
      });
    });

    it('KEY_post_search', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      const legacyProps = appDefWithAuth.legacy.searches.movie.operation;
      legacyProps.url = legacyProps.url.replace('movie?', 'movies?');
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_search_disabled',
          'movie_post_search',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        query: 'title 20',
      };
      return app(input).then((output) => {
        output.results.length.should.equal(1);

        const movie = output.results[0];
        should.equal(movie.id, 20);
        should.equal(movie.title, 'title 20 (movie_post_search was here)');
      });
    });

    it('KEY_pre_search & KEY_post_search', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_search_disabled',
          'movie_pre_search',
        );
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_search_disabled',
          'movie_post_search',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        query: 'title 20',
      };
      return app(input).then((output) => {
        output.results.length.should.equal(1);

        const movie = output.results[0];
        should.equal(movie.id, 20);
        should.equal(movie.title, 'title 20 (movie_post_search was here)');
      });
    });

    it('KEY_search', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_search_disabled',
          'movie_search',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.perform',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        query: 'title 12',
      };
      return app(input).then((output) => {
        output.results.length.should.equal(1);

        const movie = output.results[0];
        should.equal(movie.id, 12);
        should.equal(movie.title, 'title 12 (movie_search was here)');
      });
    });

    it('KEY_search, StopRequestException', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_search_stop_request',
          'movie_search',
        );
      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.perform',
      );
      return app(input).then((output) => {
        should.deepEqual(output.results, []);
      });
    });

    it('scriptingless resource', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      const legacyProps = appDefWithAuth.legacy.searches.movie.operation;
      legacyProps.resourceUrl = legacyProps.resourceUrl.replace(
        '/movie/',
        '/movies/',
      );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.performGet',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = {
        id: 5,
      };
      return app(input).then((output) => {
        const movie = output.results;
        should.equal(movie.id, 5);
        should.equal(movie.title, 'title 5');
      });
    });

    it('KEY_pre_read_resource', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_read_resource_disabled',
          'movie_pre_read_resource',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.performGet',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = { id: 5 };
      return app(input).then((output) => {
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
        '/movies/',
      );
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_read_resource_disabled',
          'movie_post_read_resource',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.performGet',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = { id: 6 };
      return app(input).then((output) => {
        const movie = output.results;
        should.equal(movie.id, 6);
        should.equal(
          movie.title,
          'title 6 (movie_post_read_resource was here)',
        );
        should.equal(movie.anotherId, 6);
      });
    });

    it('KEY_post_read_resource, returning array', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      const legacyProps = appDefWithAuth.legacy.searches.movie.operation;
      legacyProps.resourceUrl = legacyProps.resourceUrl.replace(
        '/movie/',
        '/movies/',
      );
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_read_resource_array',
          'movie_post_read_resource',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.performGet',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = { id: 6 };
      return app(input).then((output) => {
        const movie = output.results;
        should.equal(movie.rating, 'PG');
        should.equal(movie.year, 2020);
      });
    });

    it('KEY_pre_read_resource & KEY_post_read_resource', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_read_resource_disabled',
          'movie_pre_read_resource',
        );
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_read_resource_disabled',
          'movie_post_read_resource',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.performGet',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = { id: 7 };
      return app(input).then((output) => {
        const movie = output.results;
        should.equal(movie.id, 7);
        should.equal(
          movie.title,
          'title 7 (movie_post_read_resource was here)',
        );
        should.equal(movie.anotherId, 7);
      });
    });

    it('KEY_read_resource', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_read_resource_disabled',
          'movie_read_resource',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.performGet',
      );
      input.bundle.authData = { api_key: 'secret' };
      input.bundle.inputData = { id: 8 };
      return app(input).then((output) => {
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
        'searches.movie.operation.inputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
        const fields = output.results;
        should.equal(fields.length, 2);
        should.equal(fields[0].key, 'query');
        should.equal(fields[1].key, 'luckyNumber');
      });
    });

    it('KEY_pre_custom_search_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_custom_search_fields_disabled',
          'movie_pre_custom_search_fields',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.inputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
        const fields = output.results;
        should.equal(fields.length, 2);
        should.equal(fields[0].key, 'query');
        should.equal(fields[1].key, 'luckyNumber');
      });
    });

    it('KEY_post_custom_search_fields', () => {
      const appDefWithAuth = withAuth(appDefinition, apiKeyAuth);
      appDefWithAuth.legacy.searches.movie.operation.inputFieldsUrl += 's';
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_custom_search_fields_disabled',
          'movie_post_custom_search_fields',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.inputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
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
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_custom_search_fields_disabled',
          'movie_pre_custom_search_fields',
        );
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_custom_search_fields_disabled',
          'movie_post_custom_search_fields',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.inputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
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
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_custom_search_fields_disabled',
          'movie_custom_search_fields',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.inputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
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
        'searches.movie.operation.outputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
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
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_custom_search_result_fields_disabled',
          'movie_pre_custom_search_result_fields',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.outputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
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
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_custom_search_result_fields_disabled',
          'movie_post_custom_search_result_fields',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.outputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
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
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_pre_custom_search_result_fields_disabled',
          'movie_pre_custom_search_result_fields',
        );
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_post_custom_search_result_fields_disabled',
          'movie_post_custom_search_result_fields',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.outputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
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
      appDefWithAuth.legacy.scriptingSource =
        appDefWithAuth.legacy.scriptingSource.replace(
          'movie_custom_search_result_fields_disabled',
          'movie_custom_search_result_fields',
        );

      const compiledApp = schemaTools.prepareApp(appDefWithAuth);
      const app = createApp(appDefWithAuth);

      const input = createTestInput(
        compiledApp,
        'searches.movie.operation.outputFields',
      );
      input.bundle.authData = { api_key: 'secret' };
      return app(input).then((output) => {
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
