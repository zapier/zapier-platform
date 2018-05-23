'use strict';

require('should');
const createlogger = require('../src/tools/create-logger');

describe('logger', () => {
  const options = {
    endpoint: 'http://zapier-httpbin.herokuapp.com/post',
    token: 'fake-token'
  };

  // httpbin/post echoes all the input body and headers in the response

  it('should log to graylog', () => {
    const event = {};
    const logger = createlogger(event, options);
    const data = { key: 'val' };

    return logger('test', data).then(response => {
      response.headers.get('content-type').should.eql('application/json');
      response.status.should.eql(200);
      response.content.json.should.eql({
        token: options.token,
        message: 'test',
        data: {
          log_type: 'console',
          key: 'val'
        }
      });
    });
  });

  it('should include bundle meta', () => {
    const logExtra = {
      'meta-key': 'meta-value'
    };

    const logger = createlogger({ logExtra }, options);

    return logger('test').then(response => {
      response.status.should.eql(200);
      response.content.json.should.eql({
        token: options.token,
        message: 'test',
        data: {
          log_type: 'console',
          'meta-key': 'meta-value'
        }
      });
    });
  });

  it('should replace auth data', () => {
    const bundle = {
      authData: {
        password: 'secret',
        key: 'notell'
      }
    };
    const logger = createlogger({ bundle }, options);

    const data = bundle.authData;

    return logger('test', data).then(response => {
      response.status.should.eql(200);
      response.content.json.should.eql({
        token: options.token,
        message: 'test',
        data: {
          password: ':censored:6:a5023f748d:',
          log_type: 'console',
          key: ':censored:6:8f63f9ff57:'
        }
      });
    });
  });

  it('should replace sensitive data inside strings', () => {
    const bundle = {
      authData: {
        password: 'secret',
        key: 'notell'
      }
    };
    const logger = createlogger({ bundle }, options);

    const data = {
      response_content: `{
        "something": "secret",
        "somethingElse": "notell",
      }`
    };

    return logger('test', data).then(response => {
      response.status.should.eql(200);
      response.content.json.should.eql({
        token: options.token,
        message: 'test',
        data: {
          response_content: `{
        "something": ":censored:6:a5023f748d:",
        "somethingElse": ":censored:6:8f63f9ff57:",
      }`,
          log_type: 'console'
        }
      });
    });
  });

  it('should replace sensitive data inside response', () => {
    const bundle = {
      authData: {
        refresh_token: 'whatever'
      }
    };
    const logger = createlogger({ bundle }, options);

    const data = {
      response_json: {
        access_token: 'super_secret',
        PASSWORD: 'top_secret',
        name: 'not so secret'
      },
      response_content: `{
        "access_token": "super_secret",
        "PASSWORD": "top_secret",
        "name": "not so secret"
      }`
    };

    return logger('test', data).then(response => {
      response.status.should.eql(200);
      response.content.json.should.eql({
        token: options.token,
        message: 'test',
        data: {
          response_json: {
            access_token: ':censored:12:8e4a58294b:',
            PASSWORD: ':censored:10:b0c55acfea:',
            name: 'not so secret'
          },
          response_content: `{
        "access_token": ":censored:12:8e4a58294b:",
        "PASSWORD": ":censored:10:b0c55acfea:",
        "name": "not so secret"
      }`,
          log_type: 'console'
        }
      });
    });
  });

  it('should not replace safe log keys', () => {
    const bundle = {
      authData: {
        password: 'secret',
        key: '123456789'
      }
    };
    const logExtra = {
      customuser_id: '123456789' // This is a safe log key
    };
    const logger = createlogger({ bundle, logExtra }, options);

    const data = bundle.authData;

    return logger('test', data).then(response => {
      response.status.should.eql(200);
      response.content.json.should.eql({
        token: options.token,
        message: 'test',
        data: {
          password: ':censored:6:a5023f748d:',
          log_type: 'console',
          key: ':censored:9:699f352527:',
          customuser_id: logExtra.customuser_id
        }
      });
    });
  });
});
