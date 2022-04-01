'use strict';

require('should');
const createlogger = require('../src/tools/create-logger');
const querystring = require('querystring');
const { Headers } = require('node-fetch');
const {
  replaceHeaders,
} = require('../src/http-middlewares/after/middleware-utils');

const { FAKE_LOG_URL, mockLogServer } = require('./tools/mocky');

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
    const response = await logger.end();
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
    const response = await logger.end();
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
    const response = await logger.end();
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
    const response = await logger.end();
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      {
        message: '123 from google.com',
        data: {
          log_type: 'console',
          request_headers: 'authorization: basic :censored:10:cf265ec679:',
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
    const response = await logger.end();
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      {
        message: '123 from url google.com',
        data: {
          log_type: 'console',
          request_headers: 'authorization: basic :censored:10:cf265ec679:',
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
    const response = await logger.end();
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
        api_key: 'pa$$word',
      })}`,
    };

    logger('test', data);
    const response = await logger.end();
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
          request_url: 'https://test.com/?api_key=:censored:8:89250e9365:',
        },
      },
    ]);
  });

  it('should replace sensitive data inside response', async () => {
    const bundle = {
      authData: {
        refresh_token: 'whatever',
      },
    };
    const logger = createlogger({ bundle }, options);

    const data = {
      response_json: {
        access_token: 'super_secret',
        PASSWORD: 'top_secret',
        name: 'not so secret',
      },
      response_content: `{
        "access_token": "super_secret",
        "PASSWORD": "top_secret",
        "name": "not so secret"
      }`,
    };

    logger('test', data);
    const response = await logger.end();
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      {
        message: 'test',
        data: {
          response_json: {
            access_token: ':censored:12:94a59e640f:',
            PASSWORD: ':censored:10:0c2fe1350e:',
            name: 'not so secret',
          },
          response_content: `{
        "access_token": ":censored:12:94a59e640f:",
        "PASSWORD": ":censored:10:0c2fe1350e:",
        "name": "not so secret"
      }`,
          log_type: 'console',
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
      response_json: {
        hello: 314159265,
      },
      response_content: `{
        "hello": 314159265
      }`,
    };

    logger('test', data);
    const response = await logger.end();
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      {
        message: 'test',
        data: {
          response_json: {
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
  it('should replace sensitive data that nested', async () => {
    const bundle = {
      authData: {
        nested: { secret: 8675309 },
      },
    };
    const logger = createlogger({ bundle }, options);

    const data = {
      response_json: {
        nested: { secret: 8675309 },
      },
      response_content: `{
        nested: { secret: 8675309 }
      }`,
    };

    logger('test', data);
    const response = await logger.end();
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      {
        message: 'test',
        data: {
          response_json: {
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
      customuser_id: '123456789', // This is a safe log key
    };
    const logger = createlogger({ bundle, logExtra }, options);

    const data = bundle.authData;

    logger('test', data);
    const response = await logger.end();
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
    const response = await logger.end();
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

  it('should not replace urls from log extra', async () => {
    const bundle = {
      authData: {
        password: 'hunter2',
      },
    };
    const logger = createlogger({ bundle }, options);

    const data = {
      input: {
        response: {
          json: {
            data: [
              // An app could have thousands of URLs in a response. We don't
              // want these to be in the sensitive vallues and make secret
              // scrubbing too slow.
              'https://example.com/?q=1',
              'https://example.com/?q=2',
              'https://example.com/?q=3',
            ],
            token: 'something',
          },
        },
      },
    };

    logger('Called something by hunter2', data);
    const response = await logger.end();
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      {
        message: 'Called :censored:9:a468e1d9fc: by :censored:7:850233b460:',
        data: {
          log_type: 'console',
          input: {
            response: {
              json: {
                data: [
                  'https://example.com/?q=1',
                  'https://example.com/?q=2',
                  'https://example.com/?q=3',
                ],
                token: ':censored:9:a468e1d9fc:',
              },
            },
          },
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
    const response = await logger.end();
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

  it('should send multiple logs in a request', async () => {
    const logger = createlogger({}, options);

    logger('hello 1', { customuser_id: 1 });
    logger('hello 2', { customuser_id: 2 });
    logger('hello 3', { customuser_id: 3 });

    const response = await logger.end();
    response.status.should.eql(200);
    response.content.token.should.eql(options.token);
    response.content.logs.should.deepEqual([
      { message: 'hello 1', data: { log_type: 'console', customuser_id: 1 } },
      { message: 'hello 2', data: { log_type: 'console', customuser_id: 2 } },
      { message: 'hello 3', data: { log_type: 'console', customuser_id: 3 } },
    ]);
  });
});
