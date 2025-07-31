'use strict';

require('should');
const nock = require('nock');

const createlogger = require('../src/tools/create-logger');
const querystring = require('querystring');
const { Headers } = require('node-fetch');
const {
  replaceHeaders,
} = require('../src/http-middlewares/after/middleware-utils');

const { FAKE_LOG_URL, mockLogServer } = require('./tools/mocky');
const {
  prepareRequestLog,
} = require('../src/http-middlewares/after/log-response');

// little helper to prepare a req/res pair like the http logger does
const prepareTestRequest = ({
  reqBody = {},
  resBody = {},
  reqQueryParams = '',
  resHeaders = {},
} = {}) =>
  prepareRequestLog(
    {
      url: `http://example.com${
        reqQueryParams ? '?' + querystring.stringify(reqQueryParams) : ''
      }`,
      method: 'POST',
      headers: {
        accept: 'application/json',
      },
      // we usually stringify this in prepare-request.coerceBody, so mirror that behavior here
      body: JSON.stringify(reqBody),
    },
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
        ...resHeaders,
      },

      content: resBody,
    },
  );

describe('logger', () => {
  const options = {
    endpoint: `${FAKE_LOG_URL}/input`,
    token: 'fake-token',
  };

  beforeEach(() => {
    // This fake log server echoes the input request in the response
    mockLogServer();
  });

  it('should log to graylog', async () => {
    const event = {};
    const logger = createlogger(event, options);
    const data = { key: 'val' };

    logger('test', data);
    const response = await logger.end(1000);
    response.status.should.eql(200);
    response.content.contentType.should.containEql('application/x-ndjson');
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      { message: 'test', data: { log_type: 'console', key: 'val' } },
    ]);
  });

  it('should include bundle meta', async () => {
    const logExtra = {
      'meta-key': 'meta-value',
    };

    const logger = createlogger({ logExtra }, options);

    logger('test');
    const response = await logger.end(1000);
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      {
        message: 'test',
        data: { log_type: 'console', 'meta-key': 'meta-value' },
      },
    ]);
  });

  it('should replace auth data', async () => {
    const bundle = {
      authData: {
        password: 'secret',
        key: 'notell',
      },
    };
    const logger = createlogger({ bundle }, options);
    const data = bundle.authData;

    logger('test', data);
    const response = await logger.end(1000);
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      {
        message: 'test',
        data: {
          password: ':censored:6:57a71b6062:',
          log_type: 'console',
          key: ':censored:6:e3b0ee5182:',
        },
      },
    ]);
  });

  it('should censor auth headers', async () => {
    const bundle = {
      authData: {
        key: 'verysecret',
      },
      headers: {
        request_headers: {
          authorization: 'basic dmVyeXNlY3JldA==',
        },
        response_headers: {
          Authorization: 'basic OnZlcnlzZWNyZXRwbGVhc2U=',
        },
      },
    };
    const logger = createlogger({ bundle }, options);

    logger('123 from google.com', bundle.headers);
    const response = await logger.end(1000);
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      {
        message: '123 from google.com',
        data: {
          log_type: 'console',
          request_headers: 'authorization: :censored:22:4b0b50fb9c:',
          response_headers: 'Authorization: :censored:30:2a1f21f809:',
        },
      },
    ]);
  });

  it('should work with header class', async () => {
    const bundle = {
      authData: {
        key: 'verysecret',
      },
      headers: {
        request_headers: replaceHeaders({
          headers: new Headers({
            authorization: 'basic dmVyeXNlY3JldA==',
          }),
        }).headers,
        response_headers: replaceHeaders({
          headers: new Headers({
            Authorization: 'basic OnZlcnlzZWNyZXRwbGVhc2U=',
          }),
        }).headers,
      },
    };
    const logger = createlogger({ bundle }, options);

    logger('123 from url google.com', bundle.headers);
    const response = await logger.end(1000);
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      {
        message: '123 from url google.com',
        data: {
          log_type: 'console',
          request_headers: 'authorization: :censored:22:4b0b50fb9c:',
          response_headers: 'authorization: :censored:30:2a1f21f809:',
        },
      },
    ]);
  });

  it('should refuse to log headers that arrived as strings', async () => {
    const bundle = {
      authData: {
        key: 'verysecret',
      },
      headers: {
        request_headers: 'authorization: basic dmVyeXNlY3JldA==',
        response_headers: 'authorization: basic dmVyeXNlY3JldA==',
      },
    };
    const logger = createlogger({ bundle }, options);

    logger('123 from url google.com', bundle.headers);
    const response = await logger.end(1000);
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      {
        message: '123 from url google.com',
        data: {
          log_type: 'console',
          request_headers: 'ERR - refusing to log possibly uncensored headers',
          response_headers: 'ERR - refusing to log possibly uncensored headers',
        },
      },
    ]);
  });

  it('should replace sensitive data inside strings', async () => {
    const bundle = {
      authData: {
        password: 'secret',
        key: 'notell',
        api_key: 'pa$$word',
      },
    };
    const logger = createlogger({ bundle }, options);

    const data = {
      response_content: `{
        "something": "secret",
        "somethingElse": "notell",
      }`,
      request_url: `https://test.com/?${querystring.stringify({
        // should be parsed out
        api_key: 'uniquevalue',
      })}`,
    };

    logger('test', data);
    const response = await logger.end(1000);
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      {
        message: 'test',
        data: {
          log_type: 'console',
          response_content: `{
        "something": ":censored:6:57a71b6062:",
        "somethingElse": ":censored:6:e3b0ee5182:",
      }`,
          request_url: 'https://test.com/?api_key=:censored:11:94aca9077b:',
        },
      },
    ]);
  });

  it('should replace novel sensitive data', async () => {
    // this test should, as closely as possible, match what we actually log after an http request from z.request
    const bundle = {
      authData: {
        refresh_token: 'very_secret',
      },
    };
    const logger = createlogger({ bundle }, options);

    const { message, data } = prepareTestRequest({
      reqBody: {
        // value appears only here; logger needs to parse this out of a string to censor it properly
        access_token: 'super_secret',
        refresh_token: bundle.authData.refresh_token,
      },
      resBody: {
        // same here
        access_token: 'some new token',
      },
      reqQueryParams: { api_key: 'secret-key' },
    });

    logger(message, data);
    const response = await logger.end(1000);
    response.status.should.eql(200);

    response.content.logs.should.deepEqual([
      {
        message: '200 POST http://example.com',
        data: {
          log_type: 'http',
          request_type: 'devplatform-outbound',
          request_url: 'http://example.com',
          request_params: 'api_key=:censored:10:ad15d65bcc:',
          request_method: 'POST',
          request_headers: 'accept: application/json',
          request_data:
            '{"access_token":":censored:12:94a59e640f:","refresh_token":":censored:11:abafa91900:"}',
          request_via_client: true,
          response_status_code: 200,
          response_headers: 'content-type: application/json',
          response_content: '{"access_token":":censored:14:777829d1c1:"}',
        },
      },
    ]);
  });

  it('should replace secret in response content as a JSON string', async () => {
    const event = {
      method: 'authentication.sessionConfig.perform',
    };
    const logger = createlogger(event, options);

    const { message, data } = prepareTestRequest({
      reqBody: {
        username: 'user1234',
        password: 'password1234',
      },
      resBody: '"new_access_token_is_secret"',
    });

    logger(message, data);
    const response = await logger.end(1000);
    response.status.should.eql(200);

    response.content.logs.should.deepEqual([
      {
        message: '200 POST http://example.com',
        data: {
          log_type: 'http',
          request_type: 'devplatform-outbound',
          request_url: 'http://example.com',
          request_method: 'POST',
          request_headers: 'accept: application/json',
          request_data:
            '{"username":"user1234","password":":censored:12:60562c5b6c:"}',
          request_via_client: true,
          response_status_code: 200,
          response_headers: 'content-type: application/json',
          response_content: '":censored:26:fea118210f:"',
        },
      },
    ]);
  });

  it('should replace secret in response content for oauth1 as query params', async () => {
    const event = {
      method: 'authentication.oauth1Config.getAccessToken',
    };
    const logger = createlogger(event, options);

    const { message, data } = prepareTestRequest({
      reqBody: {
        username: 'user1234',
        password: 'password1234',
      },
      resBody: '"oauth_token=1234"',
    });

    logger(message, data);
    const response = await logger.end(1000);
    response.status.should.eql(200);

    response.content.logs.should.deepEqual([
      {
        message: '200 POST http://example.com',
        data: {
          log_type: 'http',
          request_type: 'devplatform-outbound',
          request_url: 'http://example.com',
          request_method: 'POST',
          request_headers: 'accept: application/json',
          request_data:
            '{"username":"user1234","password":":censored:12:60562c5b6c:"}',
          request_via_client: true,
          response_status_code: 200,
          response_headers: 'content-type: application/json',
          response_content: '":censored:16:766f32ee8c:"',
        },
      },
    ]);
  });

  it('should replace set-cookie header', async () => {
    const event = {
      method: 'authentication.sessionConfig.perform',
    };
    const logger = createlogger(event, options);

    const { message, data } = prepareTestRequest({
      reqBody: {
        username: 'user1234',
        password: 'password1234',
      },
      resBody: '"new_access_token_is_secret"',
      resHeaders: {
        'set-cookie':
          '_sid=1234567890; domain=password1234.com; HttpOnly; Secure',
      },
    });

    logger(message, data);
    const response = await logger.end(1000);
    response.status.should.eql(200);

    response.content.logs.should.deepEqual([
      {
        message: '200 POST http://example.com',
        data: {
          log_type: 'http',
          request_type: 'devplatform-outbound',
          request_url: 'http://example.com',
          request_method: 'POST',
          request_headers: 'accept: application/json',
          request_data:
            '{"username":"user1234","password":":censored:12:60562c5b6c:"}',
          request_via_client: true,
          response_status_code: 200,
          response_headers:
            'content-type: application/json\nset-cookie: :censored:58:a5f1e7f860:',
          response_content: '":censored:26:fea118210f:"',
        },
      },
    ]);
  });

  it('should leave response content of null uncensored', async () => {
    const event = {
      method: 'authentication.sessionConfig.perform',
    };
    const logger = createlogger(event, options);

    const { message, data } = prepareTestRequest({
      resBody: JSON.stringify(null),
    });

    await logger(message, data);
    const response = await logger.end(1000);
    response.status.should.eql(200);

    response.content.logs.should.deepEqual([
      {
        message: '200 POST http://example.com',
        data: {
          log_type: 'http',
          request_type: 'devplatform-outbound',
          request_url: 'http://example.com',
          request_method: 'POST',
          request_headers: 'accept: application/json',
          request_data: '{}',
          request_via_client: true,
          response_status_code: 200,
          response_headers: 'content-type: application/json',
          response_content: 'null',
        },
      },
    ]);
  });

  it('should handle missing bits of the request/response', async () => {
    // this test should, as closely as possible, match what we actually log after an http request from z.request
    const bundle = {
      authData: {
        refresh_token: 'very_secret',
      },
    };
    const logger = createlogger({ bundle }, options);

    const { message, data } = prepareTestRequest({
      reqBody: {
        refresh_token: bundle.authData.refresh_token,
      },
    });

    logger(message, data);
    const response = await logger.end(1000);
    response.status.should.eql(200);

    response.content.logs.should.deepEqual([
      {
        message: '200 POST http://example.com',
        data: {
          log_type: 'http',
          request_type: 'devplatform-outbound',
          request_url: 'http://example.com',
          request_method: 'POST',
          request_headers: 'accept: application/json',
          request_data: '{"refresh_token":":censored:11:abafa91900:"}',
          request_via_client: true,
          response_status_code: 200,
          response_headers: 'content-type: application/json',
          response_content: '{}',
        },
      },
    ]);
  });

  it('should replace sensitive data that is not a string', async () => {
    const bundle = {
      authData: {
        numerical_token: 314159265,
      },
    };
    const logger = createlogger({ bundle }, options);

    const data = {
      whatever: {
        hello: 314159265,
      },
      response_content: `{
        "hello": 314159265
      }`,
    };

    logger('test', data);
    const response = await logger.end(1000);
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      {
        message: 'test',
        data: {
          whatever: {
            hello: ':censored:9:0caea7fafe:',
          },
          response_content: `{
        "hello": :censored:9:0caea7fafe:
      }`,
          log_type: 'console',
        },
      },
    ]);
  });

  // this test fails because the function that creates the sensitive bank doesn't
  // recurse to find all sensitive values
  it('should replace sensitive data that is nested', async () => {
    const bundle = {
      authData: {
        nested: { secret: 8675309 },
      },
    };
    const logger = createlogger({ bundle }, options);

    const data = {
      whatever: {
        nested: { secret: 8675309 },
      },
      response_content: `{
        nested: { secret: 8675309 }
      }`,
    };

    logger('test', data);
    const response = await logger.end(1000);
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      {
        message: 'test',
        data: {
          whatever: {
            nested: {
              secret: ':censored:7:b69a1db63d:',
            },
          },
          response_content: `{
        nested: { secret: :censored:7:b69a1db63d: }
      }`,
          log_type: 'console',
        },
      },
    ]);
  });

  it('should not replace safe log keys', async () => {
    const bundle = {
      authData: {
        password: 'secret',
        key: '123456789',
      },
    };
    const logExtra = {
      customuser_id: '123456789', // customuser_id is an explicit safe log key
    };
    const logger = createlogger({ bundle, logExtra }, options);

    const data = bundle.authData;

    logger('test', data);
    const response = await logger.end(1000);
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      {
        message: 'test',
        data: {
          password: ':censored:6:57a71b6062:',
          log_type: 'console',
          key: ':censored:9:f0d5b7b789:',
          customuser_id: logExtra.customuser_id,
        },
      },
    ]);
  });

  it('should not replace safe urls', async () => {
    const bundle = {
      authData: {
        password: 'https://a-url-like.password.com',
        safe_url: 'https://example.com',
        basic_auth_url: 'https://foo:bar@example.com',
        param_url: 'https://example.com?foo=bar',
      },
    };
    const logger = createlogger({ bundle }, options);

    const data = bundle.authData;

    logger('200 GET https://example.com/test', data);
    const response = await logger.end(1000);
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      {
        message: '200 GET https://example.com/test',
        data: {
          log_type: 'console',
          password: ':censored:31:0dbc81268a:',
          // Only safe_url (no basic auth or query params) should be left
          // uncensored
          safe_url: 'https://example.com',
          basic_auth_url: ':censored:27:bad5875ee0:',
          param_url: ':censored:27:9d59e27abe:',
        },
      },
    ]);
  });

  it('should not replace safe keys', async () => {
    const bundle = {
      authData: {
        // The following are keys in authData that can be logged uncensored
        scope: 'chat:write,chat:read',
        scopes: 'user.read message.list',
        teamId: 1234567890,
        account_id: '983134213',
        username: 'john_doe_123',
        subdomain: 'zapier-1',
        team_name: 'Engineering',
        org_id: 'zapier-org-1',
        email: 'johndoe@example.com',

        // The following should be censored
        access_token: 'a_secret_token',
        password: 'hunter3456',
        unknown_field: 'should be censored if unknown',
      },
    };
    const logger = createlogger({ bundle }, options);

    logger('200 POST https://example.com/test', {
      log_type: 'http',
      response_content: JSON.stringify(bundle.authData),
    });
    const response = await logger.end(2000);
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      {
        message: '200 POST https://example.com/test',
        data: {
          log_type: 'http',
          response_content: JSON.stringify({
            scope: 'chat:write,chat:read',
            scopes: 'user.read message.list',
            teamId: 1234567890,
            account_id: '983134213',
            username: 'john_doe_123',
            subdomain: 'zapier-1',
            team_name: 'Engineering',
            org_id: 'zapier-org-1',
            email: 'johndoe@example.com',
            access_token: ':censored:14:0f3381cb70:',
            password: ':censored:10:57c6192e39:',
            unknown_field: ':censored:29:6803bf6334:',
          }),
        },
      },
    ]);
  });

  it('should handle nullish values', async () => {
    const bundle = {
      authData: {
        password: 'hunter2',
        will_be_left_alone: null,
        will_be_removed: undefined, // JSON.stringify removed keys set to `undefined`
      },
    };
    const logger = createlogger({ bundle }, options);

    const data = bundle.authData;

    logger('200 GET https://example.com/test', data);
    const response = await logger.end(1000);
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      {
        message: '200 GET https://example.com/test',
        data: {
          log_type: 'console',
          password: ':censored:7:850233b460:',
          will_be_left_alone: null,
        },
      },
    ]);
  });

  it('should honor logFieldMaxLength >= 0 from server', async () => {
    const bundle = {
      authData: {
        password: 'secret',
        key: '123456789',
      },
    };
    const logger = createlogger({ bundle, logFieldMaxLength: 40 }, options);

    const data = {
      log_type: 'http',
      response_content: '9876543210-98765443210-9876543210-9876543210',
      request_data: '0123456789-0123456789-0123456789-0123456789',
    };

    logger('200 GET https://example.com/test', data);
    const response = await logger.end(1000);
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      {
        message: '200 GET https://example.com/test',
        data: {
          log_type: 'http',
          response_content: '9876543210-98765443210-9876543210- [...]',
          request_data: '0:censored:9:f0d5b7b789:-0:censore [...]',
        },
      },
    ]);
  });

  it('should honor logFieldMaxLength == null from server', async () => {
    const bundle = {
      authData: {
        password: 'secret',
        key: '123456789',
      },
    };
    const logger = createlogger({ bundle, logFieldMaxLength: null }, options);

    const data = {
      log_type: 'http',
      response_content: '9876543210'.repeat(400),
      request_data: '0123456789'.repeat(400),
    };

    logger('200 GET https://example.com/test', data);
    const response = await logger.end(1000);
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      {
        message: '200 GET https://example.com/test',
        data: {
          log_type: 'http',
          response_content: '9876543210'.repeat(400),
          request_data: '0:censored:9:f0d5b7b789:'.repeat(400),
        },
      },
    ]);
  });

  it('should send multiple logs in a request', async () => {
    const logger = createlogger({}, options);

    logger('hello 1', { customuser_id: 1 });
    logger('hello 2', { customuser_id: 2 });
    logger('hello 3', { customuser_id: 3 });

    const response = await logger.end(1000);
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      { message: 'hello 1', data: { log_type: 'console', customuser_id: 1 } },
      { message: 'hello 2', data: { log_type: 'console', customuser_id: 2 } },
      { message: 'hello 3', data: { log_type: 'console', customuser_id: 3 } },
    ]);
  });

  it('should not wait for server to respond', async function () {
    nock.cleanAll();
    mockLogServer(1000); // simulates a slow server

    // This test should be fast
    this.timeout(100);

    const logger = createlogger({}, options);

    logger('hello 1', { customuser_id: 1 });
    logger('hello 2', { customuser_id: 2 });
    logger('hello 3', { customuser_id: 3 });

    const response = await logger.end(0); // should return immediately
    response.status.should.eql(200);
    response.content.should.eql('aborted');
  });
});
