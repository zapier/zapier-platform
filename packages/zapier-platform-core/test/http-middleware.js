'use strict';

const should = require('should');
const request = require('../src/tools/request-client');

const prepareRequest = require('../src/http-middlewares/before/prepare-request');
const addBasicAuthHeader = require('../src/http-middlewares/before/add-basic-auth-header');
const prepareResponse = require('../src/http-middlewares/after/prepare-response');
const applyMiddleware = require('../src/middleware');

describe('http requests', () => {
  it('should support async before middleware', done => {
    const addRequestHeader = req => {
      if (!req.headers) {
        req.headers = {};
      }
      req.headers.Customheader = 'custom value';
      return Promise.resolve(req);
    };

    const wrappedRequest = applyMiddleware(
      [addRequestHeader],
      [prepareResponse],
      request,
      { skipEnvelope: true }
    );

    wrappedRequest({ url: 'http://zapier-httpbin.herokuapp.com/get' })
      .then(response => {
        response.status.should.eql(200);
        JSON.parse(response.content).headers.Customheader.should.eql(
          'custom value'
        );
        done();
      })
      .catch(done);
  });

  it('should support sync before middleware', done => {
    const addRequestHeader = req => {
      if (!req.headers) {
        req.headers = {};
      }
      req.headers.Customheader = 'custom value';
      return req;
    };

    const wrappedRequest = applyMiddleware(
      [addRequestHeader],
      [prepareResponse],
      request,
      { skipEnvelope: true }
    );

    wrappedRequest({ url: 'http://zapier-httpbin.herokuapp.com/get' })
      .then(response => {
        response.status.should.eql(200);
        JSON.parse(response.content).headers.Customheader.should.eql(
          'custom value'
        );
        done();
      })
      .catch(done);
  });

  it('should throw error when middleware does not return object', done => {
    const addRequestHeader = req => {
      if (!req.headers) {
        req.headers = {};
      }
      req.headers.Customheader = 'custom value';
    };

    const wrappedRequest = applyMiddleware(
      [addRequestHeader],
      [prepareResponse],
      request,
      { skipEnvelope: true }
    );

    wrappedRequest({ url: 'http://zapier-httpbin.herokuapp.com/get' }).catch(
      err => {
        err.message.should.containEql('Middleware should return an object.');
        done();
      }
    );
  });

  it('should support async after middleware', done => {
    const addToResponseBody = response => {
      const content = JSON.parse(response.content);
      content.customKey = 'custom value';
      response.content = JSON.stringify(content);
      return Promise.resolve(response);
    };

    const wrappedRequest = applyMiddleware(
      [],
      [prepareResponse, addToResponseBody],
      request,
      { skipEnvelope: true }
    );

    wrappedRequest({ url: 'http://zapier-httpbin.herokuapp.com/get' })
      .then(response => {
        response.status.should.eql(200);
        should.not.exist(response.results); // should not be 'enveloped'
        JSON.parse(response.content).customKey.should.eql('custom value');
        done();
      })
      .catch(done);
  });

  it('should support sync after middleware', done => {
    const addToResponseBody = response => {
      const content = JSON.parse(response.content);
      content.customKey = 'custom value';
      response.content = JSON.stringify(content);
      return response;
    };

    const wrappedRequest = applyMiddleware(
      [],
      [prepareResponse, addToResponseBody],
      request,
      { skipEnvelope: true }
    );

    wrappedRequest({ url: 'http://zapier-httpbin.herokuapp.com/get' })
      .then(response => {
        response.status.should.eql(200);
        JSON.parse(response.content).customKey.should.eql('custom value');
        done();
      })
      .catch(done);
  });
});

describe('http prepareRequest', () => {
  it('should delete req.body on GET requests', () => {
    const req = prepareRequest({
      url: 'http://example.com',
      params: {
        foo: '{{inputData.foo}}'
      },
      replace: true,
      body: '123',
      input: {
        _zapier: {
          event: {
            bundle: {
              inputData: {
                foo: 'bar'
              }
            }
          },
          app: {}
        }
      }
    });

    req.url.should.eql('http://example.com');
    req.headers.should.eql({
      'user-agent': 'Zapier'
    });
    should.not.exist(req.body);
  });

  it('should force "bundle" prefix when doing replacement', () => {
    const origReq = {
      url: 'http://example.com/{{inputData.foo}}',
      replace: true,
      input: {
        _zapier: {
          event: {
            bundle: {
              inputData: {
                foo: 'bar'
              }
            }
          },
          app: {}
        }
      }
    };
    const brokenReq = prepareRequest(origReq);
    brokenReq.url.should.eql('http://example.com/{{inputData.foo}}');

    origReq.url = 'http://example.com/{{bundle.inputData.foo}}';
    const goodReq = prepareRequest(origReq);
    goodReq.url.should.eql('http://example.com/bar');
  });

  const input = {
    _zapier: {
      event: {},
      app: {}
    }
  };

  it('should coerce "json" into the body', () => {
    const origReq = {
      method: 'POST',
      url: 'http://example.com',
      json: { hello: 'world' },
      input
    };

    const fixedReq = prepareRequest(origReq);
    should(fixedReq.json).eql(undefined);
    should(fixedReq.body).eql('{"hello":"world"}');
    fixedReq.headers.should.eql({
      'content-type': 'application/json; charset=utf-8',
      'user-agent': 'Zapier'
    });
  });

  it('should coerce "form" into the body', () => {
    const origReq = {
      method: 'POST',
      url: 'http://example.com',
      form: { hello: 'world' },
      input
    };

    const fixedReq = prepareRequest(origReq);
    should(fixedReq.form).eql(undefined);
    should(fixedReq.body).eql('hello=world');
    fixedReq.headers.should.eql({
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': 'Zapier'
    });
  });

  it('should default to "json"', () => {
    const origReq = {
      method: 'POST',
      url: 'http://example.com',
      body: { hello: 'world' },
      input
    };

    const fixedReq = prepareRequest(origReq);
    should(fixedReq.json).eql(undefined);
    should(fixedReq.body).eql('{"hello":"world"}');
    fixedReq.headers.should.eql({
      'content-type': 'application/json; charset=utf-8',
      'user-agent': 'Zapier'
    });
  });

  it('should not set default headers if they are set', () => {
    const origReq = {
      method: 'POST',
      url: 'http://example.com',
      body: { hello: 'world' },
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      input
    };

    const fixedReq = prepareRequest(origReq);
    should(fixedReq.json).eql(undefined);
    should(fixedReq.body).eql('hello=world');
    fixedReq.headers.should.eql({
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': 'Zapier'
    });
  });

  it('should not set default headers if they are set — even with different case', () => {
    const origReq = {
      method: 'POST',
      url: 'http://example.com',
      body: { hello: 'world' },
      headers: {
        'Content-Type': 'application/json'
      },
      input
    };

    const fixedReq = prepareRequest(origReq);
    should(fixedReq.json).eql(undefined);
    should(fixedReq.body).eql('{"hello":"world"}');
    fixedReq.headers.should.eql({
      'Content-Type': 'application/json',
      'user-agent': 'Zapier'
    });
  });
});

describe('http addBasicAuthHeader before middelware', () => {
  const expectedValue = 'Basic dXNlcjpwYXNz';

  it('computes the Authorization Header', () => {
    const origReq = {
      headers: {}
    };
    const z = {};
    const bundle = {
      authData: {
        username: 'user',
        password: 'pass'
      }
    };
    const req = addBasicAuthHeader(origReq, z, bundle);
    req.headers.Authorization.should.eql(expectedValue);
  });

  it('handles case of no headers', () => {
    const origReq = {};
    const z = {};
    const bundle = {
      authData: {
        username: 'user',
        password: 'pass'
      }
    };
    const req = addBasicAuthHeader(origReq, z, bundle);
    req.headers.Authorization.should.eql(expectedValue);
  });

  it('does not add the header when username or password is missing', () => {
    const origReq = {};
    const z = {};
    const bundle = {
      authData: {
        username: 'user',
        password: ''
      }
    };
    var req = addBasicAuthHeader(origReq, z, bundle);
    should.not.exist(req.headers);

    bundle.authData.username = '';
    req = addBasicAuthHeader(origReq, z, bundle);
    should.not.exist(req.headers);

    delete bundle.authData;
    req = addBasicAuthHeader(origReq, z, bundle);
    should.not.exist(req.headers);
  });
});
