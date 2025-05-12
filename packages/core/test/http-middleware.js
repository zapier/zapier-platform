'use strict';

const fs = require('fs');
const path = require('path');

const nock = require('nock');
const FormData = require('form-data');
const should = require('should');

const errors = require('../src/errors');
const createAppRequestClient = require('../src/tools/create-app-request-client');
const createInput = require('../src/tools/create-input');
const request = require('../src/tools/request-client');

const prepareRequest = require('../src/http-middlewares/before/prepare-request');
const addQueryParams = require('../src/http-middlewares/before/add-query-params');
const addBasicAuthHeader = require('../src/http-middlewares/before/add-basic-auth-header');
const addDigestAuthHeader = require('../src/http-middlewares/before/add-digest-auth-header');
const prepareResponse = require('../src/http-middlewares/after/prepare-response');
const sanitizeHeaders = require('../src/http-middlewares/before/sanatize-headers');
const applyMiddleware = require('../src/middleware');
const oauth1SignRequest = require('../src/http-middlewares/before/oauth1-sign-request');
const { parseDictHeader } = require('../src/tools/http');
const { HTTPBIN_URL } = require('./constants');

describe('http requests', () => {
  it('should support async before middleware', async () => {
    const addRequestHeader = (req) => {
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
      { skipEnvelope: true },
    );

    const response = await wrappedRequest({ url: `${HTTPBIN_URL}/get` });
    response.status.should.eql(200);
    JSON.parse(response.content).headers.Customheader.should.deepEqual([
      'custom value',
    ]);
  });

  it('should support sync before middleware', async () => {
    const addRequestHeader = (req) => {
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
      { skipEnvelope: true },
    );

    const response = await wrappedRequest({
      url: `${HTTPBIN_URL}/get`,
    });
    response.status.should.eql(200);
    JSON.parse(response.content).headers.Customheader.should.eql([
      'custom value',
    ]);
  });

  it('should throw error when middleware does not return object', (done) => {
    const addRequestHeader = (req) => {
      if (!req.headers) {
        req.headers = {};
      }
      req.headers.Customheader = 'custom value';
    };

    const wrappedRequest = applyMiddleware(
      [addRequestHeader],
      [prepareResponse],
      request,
      { skipEnvelope: true },
    );

    wrappedRequest({ url: `${HTTPBIN_URL}/get` }).catch((err) => {
      err.message.should.containEql('Middleware should return an object.');
      done();
    });
  });

  it('should support async after middleware', (done) => {
    const addToResponseBody = (response) => {
      const content = JSON.parse(response.content);
      content.customKey = 'custom value';
      response.content = JSON.stringify(content);
      return Promise.resolve(response);
    };

    const wrappedRequest = applyMiddleware(
      [],
      [prepareResponse, addToResponseBody],
      request,
      { skipEnvelope: true },
    );

    wrappedRequest({ url: `${HTTPBIN_URL}/get` })
      .then((response) => {
        response.status.should.eql(200);
        should.not.exist(response.results); // should not be 'enveloped'
        JSON.parse(response.content).customKey.should.eql('custom value');
        done();
      })
      .catch(done);
  });

  it('should support sync after middleware', (done) => {
    const addToResponseBody = (response) => {
      const content = JSON.parse(response.content);
      content.customKey = 'custom value';
      response.content = JSON.stringify(content);
      return response;
    };

    const wrappedRequest = applyMiddleware(
      [],
      [prepareResponse, addToResponseBody],
      request,
      { skipEnvelope: true },
    );

    wrappedRequest({ url: `${HTTPBIN_URL}/get` })
      .then((response) => {
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
      url: 'https://example.com',
      params: {
        foo: '{{inputData.foo}}',
      },
      replace: true,
      body: '123',
      input: {
        _zapier: {
          event: {
            bundle: {
              inputData: {
                foo: 'bar',
              },
            },
          },
          app: {},
        },
      },
    });

    req.url.should.eql('https://example.com');
    req.headers.should.eql({
      'user-agent': 'Zapier',
    });
    should.not.exist(req.body);
  });

  it('should force "bundle" prefix when doing replacement', () => {
    const origReq = {
      url: 'https://example.com/{{inputData.foo}}',
      replace: true,
      input: {
        _zapier: {
          event: {
            bundle: {
              inputData: {
                foo: 'bar',
              },
            },
          },
          app: {},
        },
      },
    };
    const brokenReq = prepareRequest(origReq);
    brokenReq.url.should.eql('https://example.com/{{inputData.foo}}');

    origReq.url = 'https://example.com/{{bundle.inputData.foo}}';
    const goodReq = prepareRequest(origReq);
    goodReq.url.should.eql('https://example.com/bar');
  });

  const input = {
    _zapier: {
      event: {},
      app: {},
    },
  };

  it('should coerce "json" into the body', () => {
    const origReq = {
      method: 'POST',
      url: 'https://example.com',
      json: { hello: 'world' },
      input,
    };

    const fixedReq = prepareRequest(origReq);
    should(fixedReq.json).eql(undefined);
    should(fixedReq.body).eql('{"hello":"world"}');
    fixedReq.headers.should.eql({
      'content-type': 'application/json; charset=utf-8',
      'user-agent': 'Zapier',
    });
  });

  it('should coerce "form" into the body', () => {
    const origReq = {
      method: 'POST',
      url: 'https://example.com',
      form: { hello: 'world' },
      input,
    };

    const fixedReq = prepareRequest(origReq);
    should(fixedReq.form).eql(undefined);
    should(fixedReq.body).eql('hello=world');
    fixedReq.headers.should.eql({
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': 'Zapier',
    });
  });

  it('should default to "json"', () => {
    const origReq = {
      method: 'POST',
      url: 'https://example.com',
      body: { hello: 'world' },
      input,
    };

    const fixedReq = prepareRequest(origReq);
    should(fixedReq.json).eql(undefined);
    should(fixedReq.body).eql('{"hello":"world"}');
    fixedReq.headers.should.eql({
      'content-type': 'application/json; charset=utf-8',
      'user-agent': 'Zapier',
    });
  });

  it('should not set default headers if they are set', () => {
    const origReq = {
      method: 'POST',
      url: 'https://example.com',
      body: { hello: 'world' },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      input,
    };

    const fixedReq = prepareRequest(origReq);
    should(fixedReq.json).eql(undefined);
    should(fixedReq.body).eql('hello=world');
    fixedReq.headers.should.eql({
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': 'Zapier',
    });
  });

  it('should not set default headers if they are set — even with different case', () => {
    const origReq = {
      method: 'POST',
      url: 'https://example.com',
      body: { hello: 'world' },
      headers: {
        'Content-Type': 'application/json',
      },
      input,
    };

    const fixedReq = prepareRequest(origReq);
    should(fixedReq.json).eql(undefined);
    should(fixedReq.body).eql('{"hello":"world"}');
    fixedReq.headers.should.eql({
      'Content-Type': 'application/json',
      'user-agent': 'Zapier',
    });
  });

  it('should not skipThrowForStatus by default', () => {
    const request = prepareRequest({
      url: 'https://example.com',
      input: {
        _zapier: {
          app: {
            version: '1.0.0',
          },
        },
      },
    });
    should(request.skipThrowForStatus).eql(false);
  });

  it('should defer to the request for skipping throw', () => {
    const request = prepareRequest({
      url: 'https://example.com',
      skipThrowForStatus: false,
      input: {
        _zapier: {
          app: {
            version: '1.0.0',
            flags: {
              skipThrowForStatus: true,
            },
          },
        },
      },
    });
    should(request.skipThrowForStatus).eql(false);
  });

  it('should read shouldSkip from the app if available', () => {
    const request = prepareRequest({
      url: 'https://example.com',
      input: {
        _zapier: {
          app: {
            version: '1.0.0',
            flags: {
              skipThrowForStatus: true,
            },
          },
        },
      },
    });
    should(request.skipThrowForStatus).eql(true);
  });

  it('should error on curlies by default', () => {
    (() => {
      prepareRequest({
        url: 'https://example.com/{{bundle.inputData.foo}}',
      });
    }).should.throw(
      /Value in violation: "https:\/\/example.com\/{{bundle.inputData.foo}}" in attribute "url"/,
    );
  });

  it('should error on curlies recursively', () => {
    (() => {
      prepareRequest({
        url: 'https://example.com',
        method: 'POST',
        body: {
          files: [
            'https://example.com/files/1',
            '{{bundle.inputData.file_url}}',
          ],
        },
      });
    }).should.throw(
      /Value in violation: "{{bundle.inputData.file_url}}" in attribute "body.files.1"/,
    );
  });

  it('should not replace values in input', () => {
    const request = prepareRequest({
      replace: true,
      url: 'https://{{bundle.authData.subdomain}}.example.com/recipes',
      method: 'POST',
      body: {
        name: '{{bundle.inputData.name}}',
      },
      input: {
        _zapier: {
          event: {
            bundle: {
              authData: {
                subdomain: 'foo',
              },
              inputData: {
                query: 'bar',
                name: 'baz qux',
              },
            },
          },
          app: {
            searches: {
              find_recipe: {
                operation: {
                  perform: {
                    url: 'https://{{bundle.authData.subdomain}}.example.com/recipes',
                    params: {
                      q: '{{bundle.inputData.query}}',
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    should(request.url).eql('https://foo.example.com/recipes');
    should(request.body).eql('{"name":"baz qux"}');
    should(
      request.input._zapier.app.searches.find_recipe.operation.perform,
    ).deepEqual({
      url: 'https://{{bundle.authData.subdomain}}.example.com/recipes',
      params: {
        q: '{{bundle.inputData.query}}',
      },
    });
  });
});

describe('http querystring before middleware', () => {
  it('should encode dollars by default', () => {
    const req = {
      url: 'https://example.com',
      params: { cool: 'qwer$$qwer' },
    };
    addQueryParams(req);
    should(req.url).eql('https://example.com?cool=qwer%24%24qwer');
  });

  it('should skip encoding dollars', () => {
    const req = {
      url: 'https://example.com',
      params: { cool: 'qwer$$qwer' },
      skipEncodingChars: '$',
    };
    addQueryParams(req);
    should(req.url).eql('https://example.com?cool=qwer$$qwer');
  });

  it('should not replace existing characters in url', () => {
    const req = {
      url: 'https://example.com?name=asdf%24%24asdf',
      params: { cool: 'qwer$$qwer' },
      skipEncodingChars: '$',
    };
    addQueryParams(req);
    should(req.url).eql(
      'https://example.com?name=asdf%24%24asdf&cool=qwer$$qwer',
    );
  });

  it('should no-op on non-encodable characters', () => {
    const req = {
      url: 'https://example.com',
      params: { cool: 'qwer$$qwer' },
      skipEncodingChars: 'q',
    };
    addQueryParams(req);
    should(req.url).eql('https://example.com?cool=qwer%24%24qwer');
  });

  it('should skip encoding multiple chars', () => {
    const req = {
      url: 'https://example.com',
      params: { cool: '烏龜@$å' },
      skipEncodingChars: '$å龜',
    };
    addQueryParams(req);
    should(req.url).eql('https://example.com?cool=%E7%83%8F龜%40$å');
  });

  it('should allow to pass in a custom encodeURIComponent function', () => {
    const req = {
      url: 'https://example.com',
      params: { cool: '!*()[]' },
      encodeURIComponent: (s) => {
        return encodeURIComponent(s)
          .replaceAll('!', '%21')
          .replaceAll('*', '%2A')
          .replaceAll('(', '%28')
          .replaceAll(')', '%29');
      },
    };
    addQueryParams(req);
    should(req.url).eql('https://example.com?cool=%21%2A%28%29%5B%5D');
  });
});

describe('http addBasicAuthHeader before middelware', () => {
  const expectedValue = 'Basic dXNlcjpwYXNz';

  it('computes the Authorization Header', () => {
    const origReq = {
      headers: {},
    };
    const z = {};
    const bundle = {
      authData: {
        username: 'user',
        password: 'pass',
      },
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
        password: 'pass',
      },
    };
    const req = addBasicAuthHeader(origReq, z, bundle);
    req.headers.Authorization.should.eql(expectedValue);
  });

  it('does not add the header when username and password are missing', () => {
    const z = {};
    const bundle = {
      authData: {
        username: 'user',
        password: '',
      },
    };
    let req = addBasicAuthHeader({}, z, bundle);
    req.headers.Authorization.should.eql('Basic dXNlcjo=');

    bundle.authData.username = '';
    req = addBasicAuthHeader({}, z, bundle);
    should.not.exist(req.headers);

    delete bundle.authData;
    req = addBasicAuthHeader({}, z, bundle);
    should.not.exist(req.headers);
  });
});

describe('http addDigestAuthHeader before middleware', () => {
  it('computes the Authorization header', async () => {
    const origReq = {
      url: `${HTTPBIN_URL}/digest-auth/auth/joe/mypass/MD5`,
      headers: {},
    };
    const z = {};
    const bundle = {
      authData: {
        username: 'joe',
        password: 'mypass',
      },
    };
    const req = await addDigestAuthHeader(origReq, z, bundle);
    const res = await request(req);
    res.status.should.eql(200);

    const json = await res.json();
    json.user.should.eql('joe');
  });
});

describe('http oauth1SignRequest before middelware', () => {
  it('should sign request for oauth1', () => {
    const origReq = {
      method: 'post',
      url: 'https://example.com/foo/bar?hello=world',
      params: {
        hi: 'earth',
        name: 'alice',
      },
      body: 'number=555&message=hi',
      auth: {
        realm: 'a_realm',
        oauth_callback: 'https://example.com/callback',
        oauth_consumer_key: 'a_consumer_key',
        oauth_consumer_secret: 'a_consumer_secret',
        oauth_token: 'a_token',
        oauth_token_secret: 'a_token_secret',
        oauth_nonce: 'a_nonce',
        oauth_timestamp: '1555555555',
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const req = oauth1SignRequest(origReq);
    req.headers.Authorization.should.startWith('OAuth ');

    const params = parseDictHeader(req.headers.Authorization.substr(6));

    // Can use https://bettiolo.github.io/oauth-reference-page/ to verify the result
    params.should.eql({
      oauth_callback: 'https%3A%2F%2Fexample.com%2Fcallback',
      oauth_consumer_key: 'a_consumer_key',
      oauth_nonce: 'a_nonce',
      oauth_signature: '5Cltv9y0u%2FCqa5HXf0NdDljCmD4%3D',
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: '1555555555',
      oauth_token: 'a_token',
      oauth_version: '1.0A',
      realm: 'a_realm',
    });
  });
});

describe('http throwForStatus after middleware', () => {
  it('throws for 400 <= status < 600', async () => {
    const testLogger = () => Promise.resolve({});
    const input = createInput({}, {}, testLogger);
    const request = createAppRequestClient(input);

    await request({
      url: `${HTTPBIN_URL}/status/400`,
    }).should.be.rejectedWith(errors.ResponseError, {
      name: 'ResponseError',
      doNotContextify: true,
      message: `{"status":400,"headers":{"content-type":null,"retry-after":null},"content":"","request":{"url":"${HTTPBIN_URL}/status/400"}}`,
    });
  });

  it('does not throw for redirects (which we follow)', async () => {
    const testLogger = () => Promise.resolve({});
    const input = createInput({}, {}, testLogger);
    const request = createAppRequestClient(input);

    const response = await request({
      url: `${HTTPBIN_URL}/redirect-to`,
      params: {
        url: `${HTTPBIN_URL}/status/200`,
      },
    });

    response.status.should.equal(200);
  });
  it('does not throw for 2xx', async () => {
    const testLogger = () => Promise.resolve({});
    const input = createInput({}, {}, testLogger);
    const request = createAppRequestClient(input);

    const response = await request({
      url: `${HTTPBIN_URL}/status/200`,
    });

    response.status.should.equal(200);
  });
  it('does not throw for >= 600', async () => {
    const testLogger = () => Promise.resolve({});
    const input = createInput({}, {}, testLogger);
    const request = createAppRequestClient(input);

    const response = await request({
      url: `${HTTPBIN_URL}/status/600`,
    });

    response.status.should.equal(600);
  });
});

describe('http logResponse after middleware', () => {
  let logged;
  const testLogger = async (message, data) => {
    logged = { message, data: JSON.stringify(data) };
    return {};
  };
  const input = createInput({}, {}, testLogger);
  const request = createAppRequestClient(input);

  it('post JSON data', async () => {
    const url = `${HTTPBIN_URL}/post`;
    await request({ method: 'POST', url, body: { foo: 'bar' } });

    logged.message.should.equal(`200 POST ${url}`);

    const logData = JSON.parse(logged.data);
    logData.should.containEql({
      log_type: 'http',
      request_url: url,
      request_method: 'POST',
      request_data: '{"foo":"bar"}',
      response_status_code: 200,
    });

    const loggedResponseBody = JSON.parse(logData.response_content);
    loggedResponseBody.should.containEql({
      url,
      data: '{"foo":"bar"}',
    });
  });

  it('upload file in form data', async () => {
    const url = `${HTTPBIN_URL}/post`;

    const form = new FormData();
    form.append('filename', 'sample.txt');
    form.append('file', fs.createReadStream(path.join(__dirname, 'test.txt')));

    await request({ method: 'POST', url, body: form });

    logged.message.should.equal(`200 POST ${url}`);

    const logData = JSON.parse(logged.data);
    logData.should.containEql({
      log_type: 'http',
      request_url: url,
      request_method: 'POST',
      request_data: '<streaming data>',
      response_status_code: 200,
    });

    const loggedResponseBody = JSON.parse(logData.response_content);
    loggedResponseBody.should.containEql({
      url,
      form: { filename: ['sample.txt'] },
    });
  });
});

describe('http throwForDisallowedHostnameAfterRedirect after middleware', () => {
  it('does not throw for allowed hostnames', async () => {
    const testLogger = () => Promise.resolve({});
    const input = createInput({}, {}, testLogger);
    const request = createAppRequestClient(input);

    const localUrl = 'https://zapier.com';
    const localScope = nock(localUrl).get('/test').reply(200, 'redirected!!');

    const externalScope = nock('https://my-redirect-domain.com')
      .get('/')
      .reply(301, '', { Location: `${localUrl}/test` });

    const response = await request({
      url: 'https://my-redirect-domain.com',
    });

    response.status.should.equal(200);

    externalScope.isDone().should.be.true();
    localScope.isDone().should.be.true();
  });

  it('does not throw for disallowed hostname if no redirect has happened', async () => {
    const testLogger = () => Promise.resolve({});
    const input = createInput({}, {}, testLogger);
    const request = createAppRequestClient(input);

    const localUrl = 'http://127.0.0.1:9000';
    const localScope = nock(localUrl)
      .get('/test')
      .reply(200, 'not a redirect!!');

    const response = await request({
      url: `${localUrl}/test`,
    });

    response.status.should.equal(200);

    localScope.isDone().should.be.true();
  });

  it('throws for disallowed hostname after redirect', async () => {
    const testLogger = () => Promise.resolve({});
    const input = createInput({}, {}, testLogger);
    const request = createAppRequestClient(input);

    const localUrl = 'http://127.0.0.1:9000';
    const localScope = nock(localUrl).get('/test').reply(200, 'redirected!!');

    const externalScope = nock('http://bad-subdomain.com')
      .get('/.good-domain.com')
      .reply(301, '', { Location: `${localUrl}/test` });

    await request({
      url: `http://bad-subdomain.com/.good-domain.com`,
    }).should.be.rejectedWith(errors.Error, {
      name: 'AppError',
      doNotContextify: true,
      message: `{"message":"Redirecting to disallowed hostname"}`,
    });

    externalScope.isDone().should.be.true();

    // Ideally this would be false but without manual control of the redirect,
    // we can't prevent the request from being made...
    localScope.isDone().should.be.true();
  });
});

describe('http prepareResponse', () => {
  it('should set the expected properties', async () => {
    const request = prepareRequest({
      raw: false,
      input: {
        _zapier: {
          event: {
            bundle: {
              inputData: {
                foo: 'bar',
              },
            },
          },
          app: {},
        },
      },
    });

    const data = { foo: 'bar' };
    const content = JSON.stringify(data);
    const status = 200;
    const response = await prepareResponse({
      status,
      input: request,
      headers: {
        get: () => 'application/json',
      },
      text: () => Promise.resolve(content),
    });
    should(response.status).equal(status);
    should(response.content).equal(content);
    should(response.data).match(data);
    should(response.json).match(data); // DEPRECATED
    should(response.request).equal(request);
    should(response.skipThrowForStatus).equal(request.skipThrowForStatus);
    should(response.headers).equal(response.headers);
    should(response.getHeader(), 'application/json');
    should(response.throwForStatus).be.a.Function();
  });

  it('should set the expected properties when raw:true', async () => {
    const request = prepareRequest({
      raw: true,
      input: {
        _zapier: {
          event: {
            bundle: {
              inputData: {
                foo: 'bar',
              },
            },
          },
          app: {},
        },
      },
    });

    const content = JSON.stringify({ foo: 'bar' });
    const status = 200;
    const response = await prepareResponse({
      status,
      input: request,
      headers: {
        get: () => 'application/json',
      },
      text: () => Promise.resolve(content),
    });
    should(response.status).equal(status);
    should.throws(
      () => response.content,
      Error,
      /You passed {raw: true} in request()/,
    );
    should(response.data).be.Undefined();
    should(response.json).be.Undefined(); // DEPRECATED
    should(response.request).equal(request);
    should(response.skipThrowForStatus).equal(request.skipThrowForStatus);
    should(response.headers).equal(response.headers);
    should(response.getHeader(), 'application/json');
    should(response.throwForStatus).be.a.Function();
  });

  it('should default to parsing response.content as JSON', async () => {
    const request = prepareRequest({
      raw: false,
      input: {
        _zapier: {
          event: {
            bundle: {
              inputData: {
                foo: 'bar',
              },
            },
          },
          app: {},
        },
      },
    });

    const data = { foo: 'bar' };
    const content = JSON.stringify(data);
    const status = 200;
    const response = await prepareResponse({
      status,
      input: request,
      headers: {
        get: () => 'something/else',
      },
      text: () => Promise.resolve(content),
    });
    should(response.content).equal(content);
    should(response.data).match(data);
    should(response.json).match(data); // DEPRECATED
    should(response.getHeader(), 'something/else');
  });

  it('should be able to parse response.content when application/x-www-form-urlencoded', async () => {
    const request = prepareRequest({
      raw: false,
      input: {
        _zapier: {
          event: {
            bundle: {
              inputData: {
                foo: 'bar',
              },
            },
          },
          app: {},
        },
      },
    });

    const data = { foo: 'bar' };
    const content = 'foo=bar';
    const status = 200;
    const response = await prepareResponse({
      status,
      input: request,
      headers: {
        get: () => 'application/x-www-form-urlencoded',
      },
      text: () => Promise.resolve(content),
    });
    should(response.content).equal(content);
    should(response.data).match(data);
    should(response.json).be.Undefined(); // DEPRECATED and not forwards compatible
    should(response.getHeader(), 'application/x-www-form-urlencoded');
  });
  describe('sanitizeHeaders Middleware', () => {
    it('should trim whitespace from header keys and values', () => {
      const req = {
        headers: {
          '  Content-Type  ': '  application/json  ',
          '  Authorization  ': '  Bearer token  ',
        },
      };

      const expectedHeaders = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      };

      sanitizeHeaders(req);
      req.headers.should.deepEqual(expectedHeaders);
    });

    it('should handle empty headers object', () => {
      const req = { headers: {} };
      const expectedHeaders = {};

      sanitizeHeaders(req);
      req.headers.should.deepEqual(expectedHeaders);
    });

    it('should handle undefined headers', () => {
      const req = {};
      const expectedHeaders = {};

      sanitizeHeaders(req);
      req.headers.should.deepEqual(expectedHeaders);
    });
  });
});
