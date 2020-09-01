'use strict';

require('should');
const createlogger = require('../src/tools/create-logger');
const querystring = require('querystring');
const { Headers } = require('node-fetch');
const {
  replaceHeaders,
} = require('../src/http-middlewares/after/middleware-utils');
const { HTTPBIN_URL } = require('./constants');

describe('logger', () => {
  const options = {
    endpoint: `${HTTPBIN_URL}/post`,
    token: 'fake-token',
  };

  // httpbin/post echoes all the input body and headers in the response

  it('should log to graylog', async () => {
    const event = {};
    const logger = createlogger(event, options);
    const data = { key: 'val' };

    const response = await logger('test', data);
    response.headers.get('content-type').should.containEql('application/json');
    response.status.should.eql(200);
    response.content.json.should.eql({
      token: options.token,
      message: 'test',
      data: {
        log_type: 'console',
        key: 'val',
      },
    });
  });

  it('should include bundle meta', () => {
    const logExtra = {
      'meta-key': 'meta-value',
    };

    const logger = createlogger({ logExtra }, options);

    return logger('test').then((response) => {
      response.status.should.eql(200);
      response.content.json.should.eql({
        token: options.token,
        message: 'test',
        data: {
          log_type: 'console',
          'meta-key': 'meta-value',
        },
      });
    });
  });

  it('should replace auth data', () => {
    const bundle = {
      authData: {
        password: 'secret',
        key: 'notell',
      },
    };
    const logger = createlogger({ bundle }, options);

    const data = bundle.authData;

    return logger('test', data).then((response) => {
      response.status.should.eql(200);
      response.content.json.should.eql({
        token: options.token,
        message: 'test',
        data: {
          password: ':censored:6:a5023f748d:',
          log_type: 'console',
          key: ':censored:6:8f63f9ff57:',
        },
      });
    });
  });

  it('should censor auth headers', () => {
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

    return logger('123 from url google.com', bundle.headers).then(
      (response) => {
        response.status.should.eql(200);
        const j = response.content.json;
        j.data.request_headers.should.eql(
          'authorization: basic :censored:10:d98440830f:'
        );
        j.data.response_headers.should.eql(
          'Authorization: :censored:30:f914b1b0d1:'
        );
      }
    );
  });

  it('should work with header class', () => {
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

    return logger('123 from url google.com', bundle.headers).then(
      (response) => {
        response.status.should.eql(200);
        const j = response.content.json;
        j.data.request_headers.should.eql(
          'authorization: basic :censored:10:d98440830f:'
        );
        // Headers class downcases everything
        j.data.response_headers.should.eql(
          'authorization: :censored:30:f914b1b0d1:'
        );
      }
    );
  });

  it('should refuse to log headers that arrived as strings', () => {
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

    return logger('123 from url google.com', bundle.headers).then(
      (response) => {
        response.status.should.eql(200);
        const j = response.content.json;
        j.data.request_headers.should.eql(
          'ERR - refusing to log possibly uncensored headers'
        );
        j.data.response_headers.should.eql(
          'ERR - refusing to log possibly uncensored headers'
        );
      }
    );
  });

  it('should replace sensitive data inside strings', () => {
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

    return logger('test', data).then((response) => {
      response.status.should.eql(200);
      response.content.json.should.eql({
        token: options.token,
        message: 'test',
        data: {
          response_content: `{
        "something": ":censored:6:a5023f748d:",
        "somethingElse": ":censored:6:8f63f9ff57:",
      }`,
          request_url: 'https://test.com/?api_key=:censored:8:f274744218:',
          log_type: 'console',
        },
      });
    });
  });

  it('should replace sensitive data inside response', () => {
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

    return logger('test', data).then((response) => {
      response.status.should.eql(200);
      response.content.json.should.eql({
        token: options.token,
        message: 'test',
        data: {
          response_json: {
            access_token: ':censored:12:8e4a58294b:',
            PASSWORD: ':censored:10:b0c55acfea:',
            name: 'not so secret',
          },
          response_content: `{
        "access_token": ":censored:12:8e4a58294b:",
        "PASSWORD": ":censored:10:b0c55acfea:",
        "name": "not so secret"
      }`,
          log_type: 'console',
        },
      });
    });
  });

  it('should replace sensitive data that is not a string', () => {
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

    return logger('test', data).then((response) => {
      response.status.should.eql(200);
      response.content.json.should.eql({
        token: options.token,
        message: 'test',
        data: {
          response_json: {
            hello: ':censored:9:9cb84e8ccc:',
          },
          response_content: `{
        "hello": :censored:9:9cb84e8ccc:
      }`,
          log_type: 'console',
        },
      });
    });
  });

  // this test fails because the function that creates the sensitive bank doesn't
  // recurse to find all sensitive values
  it.skip('should replace sensitive data that nested', () => {
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

    return logger('test', data).then((response) => {
      response.status.should.eql(200);
      response.content.json.should.eql({
        token: options.token,
        message: 'test',
        data: {
          response_json: {
            nested: {
              secret: ':censored:9:9cb84e8ccc:',
            },
          },
          response_content: `{
        nested: { secret: :censored:9:9cb84e8ccc: }
      }`,
          log_type: 'console',
        },
      });
    });
  });

  it('should not replace safe log keys', () => {
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

    return logger('test', data).then((response) => {
      response.status.should.eql(200);
      response.content.json.should.eql({
        token: options.token,
        message: 'test',
        data: {
          password: ':censored:6:a5023f748d:',
          log_type: 'console',
          key: ':censored:9:699f352527:',
          customuser_id: logExtra.customuser_id,
        },
      });
    });
  });

  it('should not replace safe urls', () => {
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

    return logger(`200 GET https://example.com/test`, data).then((response) => {
      response.status.should.eql(200);
      response.content.json.should.eql({
        token: options.token,
        message: '200 GET https://example.com/test',
        data: {
          log_type: 'console',
          password: ':censored:31:68af4cbe15:',
          // Only safe_url (no basic auth or query params) should be left
          // uncensored
          safe_url: 'https://example.com',
          basic_auth_url: ':censored:27:5eaaee9fc2:',
          param_url: ':censored:27:c1e27a03b8:',
        },
      });
    });
  });
});
