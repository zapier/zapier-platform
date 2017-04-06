'use strict';

require('should');
const createlogger = require('../src/tools/create-logger');

describe('logger', () => {
  const options = {
    endpoint: 'http://zapier-httpbin.herokuapp.com/post',
    token: 'fake-token'
  };

  // httpbin/post echoes all the input body and headers in the response

  it('should log to graylog', (done) => {
    const event = {};
    const logger = createlogger(event, options);
    const data = { key: 'val' };

    logger('test', data).then(response => {
      response.headers.get('content-type').should.eql('application/json');
      response.status.should.eql(200);
      response.content.json.should.eql({
        token: 'fake-token',
        message: 'test',
        data: {
          log_type: 'console',
          key: 'val'
        }
      });
      done();
    }).catch(done);
  });

  it('should include bundle meta', (done) => {
    const logExtra = {
      'meta-key': 'meta-value'
    };

    const logger = createlogger({logExtra}, options);

    logger('test').then(response => {
      response.status.should.eql(200);
      response.content.json.should.eql({
        token: 'fake-token',
        message: 'test',
        data: {
          log_type: 'console',
          'meta-key': 'meta-value'
        }
      });
      done();
    }).catch(done);
  });

  it('should replace auth data', (done) => {
    const bundle = {
      authData: {
        password: 'secret',
        key: 'notell'
      }
    };
    const logger = createlogger({bundle}, options);

    const data = bundle.authData;

    logger('test', data).then(response => {
      response.status.should.eql(200);
      response.content.json.should.eql({
        token: 'fake-token',
        message: 'test',
        data: {
          password: ':censored:6:a5023f748d:',
          log_type: 'console',
          key: ':censored:6:8f63f9ff57:'
        }
      });
      done();
    }).catch(done);
  });

  it('should replace sensitive data inside strings', (done) => {
    const bundle = {
      authData: {
        password: 'secret',
        key: 'notell'
      },
    };
    const logger = createlogger({bundle}, options);

    const data = {
      response_content: `{
        "something": "secret",
        "somethingElse": "notell",
      }`
    };

    logger('test', data).then(response => {
      response.status.should.eql(200);
      response.content.json.should.eql({
        token: 'fake-token',
        message: 'test',
        data: {
          response_content: `{
        "something": ":censored:6:a5023f748d:",
        "somethingElse": ":censored:6:8f63f9ff57:",
      }`,
          log_type: 'console',
        }
      });
      done();
    }).catch(done);
  });

});
