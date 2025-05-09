'use strict';

const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const should = require('should');

const createAppRequestClient = require('../src/tools/create-app-request-client');
const createInput = require('../src/tools/create-input');
const errors = require('../src/errors');
const { HTTPBIN_URL } = require('./constants');

describe('request client', function () {
  const testLogger = () => Promise.resolve({});
  const input = createInput({}, {}, testLogger);

  it('should include a user-agent header', async () => {
    const request = createAppRequestClient(input);
    const response = await request({ url: `${HTTPBIN_URL}/get` });

    response.request.headers['user-agent'].should.eql('Zapier');
    response.status.should.eql(200);
    response.data.url.should.eql(`${HTTPBIN_URL}/get`);
  });

  it('should allow overriding the user-agent header', async () => {
    const request = createAppRequestClient(input);
    const response = await request({
      url: `${HTTPBIN_URL}/get`,
      headers: {
        'User-Agent': 'Zapier!',
      },
    });

    should(response.request.headers['user-agent']).eql(undefined);
    response.request.headers['User-Agent'].should.eql('Zapier!');
    response.status.should.eql(200);
    response.data.url.should.eql(`${HTTPBIN_URL}/get`);
  });

  it('should have json serializable response', async () => {
    const request = createAppRequestClient(input);
    const responseBefore = await request({
      url: `${HTTPBIN_URL}/get`,
    });
    const response = JSON.parse(JSON.stringify(responseBefore));

    response.headers['content-type'].should.containEql('application/json');
    response.status.should.eql(200);

    const body = JSON.parse(response.content);
    body.url.should.eql(`${HTTPBIN_URL}/get`);
  });

  it('should wrap a request entirely', async () => {
    const request = createAppRequestClient(input);
    const response = await request({ url: `${HTTPBIN_URL}/get` });
    response.status.should.eql(200);
    response.data.url.should.eql(`${HTTPBIN_URL}/get`);
  });

  it('should support promise bodies', async () => {
    const payload = { hello: 'world is nice' };
    const request = createAppRequestClient(input);
    const response = await request({
      method: 'POST',
      url: `${HTTPBIN_URL}/post`,
      body: Promise.resolve(payload),
    });
    response.status.should.eql(200);
    response.request.body.should.eql(JSON.stringify(payload));
    response.data.data.should.eql(JSON.stringify(payload));
  });

  it('should support streaming another request', async () => {
    const fileUrl =
      'https://s3.amazonaws.com/zapier-downloads/just-a-few-lines.txt';
    const fileExpectedContent =
      '0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15\n16\n17\n18\n19\n20\n21\n22\n23\n24\n25\n26\n27\n28\n29\n30\n';
    const request = createAppRequestClient(input);
    const response = await request({
      method: 'POST',
      url: 'https://httpbin.zapier-tooling.com/post',
      body: request({ url: fileUrl, raw: true }),
    });
    response.status.should.eql(200);
    const body = JSON.parse(response.content);
    body.data.should.eql(fileExpectedContent);
  });

  it('should handle a buffer upload fine', async () => {
    const request = createAppRequestClient(input);
    const response = await request({
      method: 'POST',
      url: 'https://httpbin.zapier-tooling.com/post',
      body: Buffer.from('hello world this is a cat (=^..^=)'),
    });
    response.status.should.eql(200);
    const body = JSON.parse(response.content);
    body.data.should.eql('hello world this is a cat (=^..^=)');
  });

  it('should handle a stream upload fine', async () => {
    const request = createAppRequestClient(input);
    const response = await request({
      method: 'POST',
      url: 'https://httpbin.zapier-tooling.com/post',
      body: fs.createReadStream(path.join(__dirname, 'test.txt')),
    });
    response.status.should.eql(200);
    const body = JSON.parse(response.content);
    body.data.should.eql('hello world this is a cat (=^..^=)');
  });

  it('should support single url param', async () => {
    const request = createAppRequestClient(input);
    const response = await request(`${HTTPBIN_URL}/get`);
    response.status.should.eql(200);
    response.data.url.should.eql(`${HTTPBIN_URL}/get`);
  });

  it('should support url param with options', async () => {
    const request = createAppRequestClient(input);
    const response = await request(`${HTTPBIN_URL}/get`, {
      headers: { A: 'B' },
    });

    response.status.should.eql(200);
    const body = JSON.parse(response.content);
    body.url.should.eql(`${HTTPBIN_URL}/get`);
    body.headers.A.should.deepEqual(['B']);
  });

  it('should support bytes', async () => {
    const request = createAppRequestClient(input);
    const response = await request(`${HTTPBIN_URL}/bytes/1024`);
    response.status.should.eql(200);
    // it tries to decode the bytes /shrug
    response.content.length.should.belowOrEqual(1024);
  });

  it('should support bytes raw', async () => {
    const request = createAppRequestClient(input);
    const response = await request(`${HTTPBIN_URL}/bytes/1024`, { raw: true });
    response.status.should.eql(200);
    should(response.buffer).be.type('function');
    should(response.text).be.type('function');
    should(response.body.pipe).be.type('function');
  });

  it('should support streaming bytes', async () => {
    const request = createAppRequestClient(input);
    const response = await request(`${HTTPBIN_URL}/stream-bytes/1024`);
    response.status.should.eql(200);
    // it tries to decode the bytes /shrug
    response.content.length.should.belowOrEqual(1024);
  });

  it('should support streaming bytes raw', async () => {
    const request = createAppRequestClient(input);
    const response = await request(`${HTTPBIN_URL}/stream-bytes/1024`, {
      raw: true,
    });
    response.status.should.eql(200);
    should(response.buffer).be.type('function');
    should(response.text).be.type('function');
    should(response.body.pipe).be.type('function');
  });

  it('should support streaming bytes raw as buffer', async () => {
    const request = createAppRequestClient(input);
    const response = await request(`${HTTPBIN_URL}/stream-bytes/1024`, {
      raw: true,
    });
    response.status.should.eql(200);

    const buffer = await response.buffer();
    buffer.length.should.eql(1024);
  });

  it('should run any beforeRequest functions', async () => {
    const inputWithBeforeMiddleware = createInput(
      {
        beforeRequest: [
          (request) => {
            request.headers['X-Testing-True'] = 'Yes';
            return request;
          },
        ],
      },
      {},
      testLogger,
    );
    const request = createAppRequestClient(inputWithBeforeMiddleware);
    const response = await request({ url: `${HTTPBIN_URL}/get` });

    response.request.headers['X-Testing-True'].should.eql('Yes');
    response.status.should.eql(200);
    response.data.url.should.eql(`${HTTPBIN_URL}/get`);
  });

  it('should default to run throwForStatus', () => {
    const request = createAppRequestClient(input);
    return request({
      url: `${HTTPBIN_URL}/status/400`,
    }).should.be.rejectedWith(errors.ResponseError);
  });

  it('should be able to skip throwForStatus via request', async () => {
    const request = createAppRequestClient(input);
    const response = await request({
      url: `${HTTPBIN_URL}/status/400`,
      skipThrowForStatus: true,
    });
    response.status.should.eql(400);
  });

  it('should be able to skip throwForStatus via afterResponse', async () => {
    const inputWithAfterMiddleware = createInput(
      {
        afterResponse: [
          (response) => {
            response.skipThrowForStatus = true;
            return response;
          },
        ],
      },
      {},
      testLogger,
    );
    const request = createAppRequestClient(inputWithAfterMiddleware);
    const response = await request({
      url: `${HTTPBIN_URL}/status/400`,
    });
    response.status.should.eql(400);
  });

  it('should parse form type request body', async () => {
    const request = createAppRequestClient(input);
    const response = await request({
      url: `${HTTPBIN_URL}/post`,
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: {
        name: 'Something Else',
        directions: '!!No Way José',
      },
    });

    response.status.should.eql(200);
    response.request.body.should.eql(
      'name=Something+Else&directions=!!No+Way+Jos%C3%A9',
    );
    const body = JSON.parse(response.content);
    body.form.name.should.deepEqual(['Something Else']);
    body.form.directions.should.deepEqual(['!!No Way José']);
  });

  it('should not parse form type request body when string', async () => {
    const request = createAppRequestClient(input);
    const response = await request({
      url: `${HTTPBIN_URL}/post`,
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: 'name=Something Else&directions=!!No Way José',
    });

    response.status.should.eql(200);
    response.request.body.should.eql(
      'name=Something Else&directions=!!No Way José',
    );
    const body = JSON.parse(response.content);
    body.form.name.should.deepEqual(['Something Else']);
    body.form.directions.should.deepEqual(['!!No Way José']);
  });

  it('should block self-signed SSL certificate', () => {
    const request = createAppRequestClient(input);
    return request('https://self-signed.badssl.com').should.be.rejectedWith({
      name: 'FetchError',
    });
  });

  it('should allow to disable SSL certificate check', () => {
    const newInput = _.cloneDeep(input);
    newInput._zapier.event.verifySSL = false;
    const request = createAppRequestClient(newInput);
    return request('https://self-signed.badssl.com').then((response) => {
      response.status.should.eql(200);
    });
  });

  it('should be able to redirect from https to http while disabling SSL certificate checks', () => {
    const newInput = _.cloneDeep(input);
    newInput._zapier.event.verifySSL = false;
    const request = createAppRequestClient(newInput);
    return request(`${HTTPBIN_URL}/redirect-to?url=http://example.com`).then(
      (response) => {
        response.status.should.eql(200);
      },
    );
  });

  it('should allow unencrypted requests when SSL checks are disabled', () => {
    const newInput = _.cloneDeep(input);
    newInput._zapier.event.verifySSL = false;
    const request = createAppRequestClient(newInput);
    return request(`${HTTPBIN_URL}/get`).then((response) => {
      response.status.should.eql(200);
    });
  });

  it('should delete GET body by default', async function () {
    this.timeout(1000 * 30); // 30 secs timeout
    this.retries(3); // retry up to 3 times

    const request = createAppRequestClient(input);
    const response = await request({
      method: 'GET',
      url: 'https://auth-json-server.zapier-staging.com/echo',
      body: {
        name: 'Darth Vader',
      },
    });
    response.status.should.eql(200);
    response.data.method.should.eql('GET');
    should.not.exist(response.data.textBody);
  });

  it('should allow GET with body', async function () {
    this.timeout(1000 * 30); // 30 secs timeout
    this.retries(3); // retry up to 3 times

    const request = createAppRequestClient(input);
    const response = await request({
      method: 'GET',
      url: 'https://auth-json-server.zapier-staging.com/echo',
      body: {
        name: 'Darth Vader',
      },
      allowGetBody: true,
    });
    response.status.should.eql(200);
    response.data.method.should.eql('GET');
    response.data.textBody.should.eql('{"name":"Darth Vader"}');
  });

  it('allowGetBody should not send empty body', async function () {
    this.timeout(1000 * 30); // 30 secs timeout
    this.retries(3); // retry up to 3 times

    const request = createAppRequestClient(input);
    const response = await request({
      method: 'GET',
      url: 'https://auth-json-server.zapier-staging.com/echo',
      body: {},
      allowGetBody: true,
    });
    response.status.should.eql(200);
    response.data.method.should.eql('GET');
    should.not.exist(response.data.textBody);
  });

  describe('adds query params', () => {
    it('should error on curly params default', async () => {
      const request = createAppRequestClient(input);

      return request({
        url: `${HTTPBIN_URL}/get`,
        params: {
          something: '',
          really: '{{bundle.inputData.really}}',
          cool: 'true',
        },
      }).should.be.rejectedWith(
        /Value in violation: "{{bundle.inputData.really}}" in attribute "params.really"/,
      );
    });

    it('should replace remaining curly params with empty string when set as false', async () => {
      const request = createAppRequestClient(input);
      const response = await request({
        url: `${HTTPBIN_URL}/get`,
        params: {
          something: '',
          really: '{{bundle.inputData.really}}',
          cool: 'true',
        },
        removeMissingValuesFrom: {
          params: false,
        },
        // Set `replace` to true to make it act like a shorthand request
        replace: true,
      });

      response.data.args.something.should.deepEqual(['']);
      response.data.args.really.should.deepEqual(['']);
      response.data.args.cool.should.deepEqual(['true']);
      response.status.should.eql(200);

      const body = JSON.parse(response.content);
      body.url.should.eql(`${HTTPBIN_URL}/get?something=&really=&cool=true`);
    });

    it('should omit empty params when set as true', async () => {
      const event = {
        bundle: {
          inputData: {
            name: 'zapier',
          },
        },
      };
      const request = createAppRequestClient(
        createInput({}, event, testLogger),
      );
      const response = await request({
        url: `${HTTPBIN_URL}/get`,
        params: {
          something: '',
          really: '{{bundle.inputData.really}}',
          cool: 'false',
          name: '{{bundle.inputData.name}}',
          foo: null,
          bar: undefined,
          zzz: '[]',
          yyy: '{}',
          qqq: ' ',
        },
        removeMissingValuesFrom: {
          params: true,
        },
        // Set `replace` to true to make it act like a shorthand request
        replace: true,
      });

      should(response.data.args.something).eql(undefined);
      should(response.data.args.foo).eql(undefined);
      should(response.data.args.bar).eql(undefined);
      should(response.data.args.empty).eql(undefined);
      should(response.data.args.really).eql(undefined);

      response.data.args.cool.should.deepEqual(['false']);
      response.data.args.zzz.should.deepEqual(['[]']);
      response.data.args.yyy.should.deepEqual(['{}']);
      response.data.args.qqq.should.deepEqual([' ']);
      response.data.args.name.should.deepEqual(['zapier']);
      response.status.should.eql(200);

      const body = JSON.parse(response.content);
      body.url.should.eql(
        `${HTTPBIN_URL}/get?cool=false&name=zapier&zzz=%5B%5D&yyy=%7B%7D&qqq=%20`,
      );
    });

    it('should not include ? if there are no params after cleaning', async () => {
      const request = createAppRequestClient(input);
      const response = await request({
        url: `${HTTPBIN_URL}/get`,
        params: {
          something: '',
          cool: '',
        },
        removeMissingValuesFrom: {
          params: true,
        },
      });

      should(response.data.args.something).eql(undefined);
      should(response.data.args.cool).eql(undefined);
      response.status.should.eql(200);

      const body = JSON.parse(response.content);
      body.url.should.eql(`${HTTPBIN_URL}/get`);
    });
  });

  describe('shorthand hook subscriptions', () => {
    it('should resolve bundle tokens in performSubscribe', async () => {
      const targetUrl = 'https://zapier.com/hooks';
      const event = {
        bundle: {
          targetUrl,
          meta: {
            zap: { id: 987 },
          },
        },
      };
      const subscribeInput = createInput({}, event, testLogger);
      const request = createAppRequestClient(subscribeInput);
      const response = await request({
        url: `${HTTPBIN_URL}/post`,
        method: 'POST',
        body: {
          hookUrl: '{{bundle.targetUrl}}',
          zapId: '{{bundle.meta.zap.id}}',
        },
        // Set `replace` to true to make it act like a shorthand request
        replace: true,
      });

      const { hookUrl, zapId } = JSON.parse(response.data.data);
      hookUrl.should.eql(targetUrl);
      zapId.should.eql(987);
    });

    it('should resolve bundle tokens in performUnubscribe', async () => {
      const subscribeData = { id: 123 };
      const event = {
        bundle: { subscribeData },
      };
      const subscribeInput = createInput({}, event, testLogger);
      const request = createAppRequestClient(subscribeInput);
      const response = await request({
        url: `${HTTPBIN_URL}/delete`,
        method: 'DELETE',
        params: {
          id: '{{bundle.subscribeData.id}}',
        },
        // Set `replace` to true to make it act like a shorthand request
        replace: true,
      });

      const { url } = JSON.parse(response.content);
      response.data.args.id.should.deepEqual(['123']);
      url.should.eql(`${HTTPBIN_URL}/delete?id=123`);
    });
  });

  describe('resolves curlies', () => {
    it('should keep valid data types', async () => {
      const event = {
        bundle: {
          inputData: {
            number: 123,
            bool: true,
            float: 123.456,
            arr: [1, 2, 3],
          },
        },
      };
      const bodyInput = createInput({}, event, testLogger);
      const request = createAppRequestClient(bodyInput);
      const response = await request({
        url: `${HTTPBIN_URL}/post`,
        method: 'POST',
        body: {
          number: '{{bundle.inputData.number}}',
          bool: '{{bundle.inputData.bool}}',
          float: '{{bundle.inputData.float}}',
          arr: '{{bundle.inputData.arr}}',
        },
        // Set `replace` to true to make it act like a shorthand request
        replace: true,
      });

      const { json } = response.data;

      should(json.empty).eql(undefined);
      json.number.should.eql(123);
      json.bool.should.eql(true);
      json.float.should.eql(123.456);
      json.arr.should.eql([1, 2, 3]);
    });

    it('should keep valid data types that are hard-coded', async () => {
      // This may seem like an usual case to be in, and for most apps it is.
      // However, converted apps that rely on legacy-scripting-runner can have
      // request bodies that are pure data, no {{}}, so we need to be sure to preserve those to
      const event = {
        bundle: {
          inputData: {
            number: 123,
            bool: true,
            float: 123.456,
            arr: [1, 2, 3],
            nested: { very: 'cool' },
          },
        },
      };
      const bodyInput = createInput({}, event, testLogger);
      const request = createAppRequestClient(bodyInput);
      const response = await request({
        url: `${HTTPBIN_URL}/post`,
        method: 'POST',
        body: {
          number: 123,
          bool: true,
          float: 123.456,
          arr: [1, 2, 3],
        },
        // Set `replace` to true to make it act like a shorthand request
        replace: true,
      });

      const { json } = response.data;
      should(json.empty).eql(undefined);
      json.number.should.eql(123);
      json.bool.should.eql(true);
      json.float.should.eql(123.456);
      json.arr.should.eql([1, 2, 3]);
    });

    it('should remove keys from body for empty values if configured to', async () => {
      const event = {
        bundle: {
          inputData: {
            name: 'Burgundy',
          },
        },
      };
      const bodyInput = createInput({}, event, testLogger);
      const request = createAppRequestClient(bodyInput);
      const response = await request({
        url: `${HTTPBIN_URL}/post`,
        method: 'POST',
        body: {
          name: '{{bundle.inputData.name}}',
          empty: '{{bundle.inputData.empty}}',
        },
        removeMissingValuesFrom: {
          body: true,
        },
        // Set `replace` to true to make it act like a shorthand request
        replace: true,
      });

      const { json } = response.data;
      should(json.empty).eql(undefined);
      json.name.should.eql('Burgundy');
    });

    it('should replace curlies with an empty string by default', async () => {
      const request = createAppRequestClient(input);
      const response = await request({
        url: `${HTTPBIN_URL}/post`,
        method: 'POST',
        body: {
          empty: '{{bundle.inputData.empty}}',
          partial: 'text {{bundle.inputData.partial}}',
          value: 'exists',
          array: [
            '{{bundle.inputData.empty}}',
            'foo{{bundle.inputData.noMatch}}',
            'bar',
          ],
          obj: {
            empty: '{{bundle.inputData.empty}}',
            partial: 'text {{bundle.inputData.partial}}',
            value: 'exists',
          },
        },
        // Set `replace` to true to make it act like a shorthand request
        replace: true,
      });

      const { json } = response.data;
      should(json.empty).eql('');
      should(json.partial).eql('text ');
      should(json.value).eql('exists');

      // We don't do recursive replacement
      should(json.array).eql([
        '{{bundle.inputData.empty}}',
        'foo{{bundle.inputData.noMatch}}',
        'bar',
      ]);
      should(json.obj).eql({
        empty: '{{bundle.inputData.empty}}',
        partial: 'text {{bundle.inputData.partial}}',
        value: 'exists',
      });
    });

    it('should interpolate strings', async () => {
      const event = {
        bundle: {
          inputData: {
            resourceId: 123,
          },
          authData: {
            access_token: 'Let me in',
          },
        },
      };
      const bodyInput = createInput({}, event, testLogger);
      const request = createAppRequestClient(bodyInput);
      const response = await request({
        url: `${HTTPBIN_URL}/post`,
        method: 'POST',
        body: {
          message: 'We just got #{{bundle.inputData.resourceId}}',
        },
        headers: {
          Authorization: 'Bearer {{bundle.authData.access_token}}',
        },
        // Set `replace` to true to make it act like a shorthand request
        replace: true,
      });

      const { json, headers } = response.data;
      json.message.should.eql('We just got #123');
      headers.Authorization.should.deepEqual(['Bearer Let me in']);
    });

    it('should throw when interpolating a string with an array', async () => {
      const event = {
        bundle: {
          inputData: {
            badData: [1, 2, 3],
          },
        },
      };
      const bodyInput = createInput({}, event, testLogger);
      const request = createAppRequestClient(bodyInput);
      return request({
        url: `${HTTPBIN_URL}/post`,
        method: 'POST',
        body: {
          message: 'No arrays, thank you: {{bundle.inputData.badData}}',
        },
        // Set `replace` to true to make it act like a shorthand request
        replace: true,
      }).should.be.rejectedWith(
        'Cannot reliably interpolate objects or arrays into a string. ' +
          'Variable `bundle.inputData.badData` is an Array:\n"1,2,3"',
      );
    });

    it('should send flatten objects', async () => {
      const event = {
        bundle: {
          inputData: {
            address: {
              street: '123 Zapier Way',
              city: 'El Mundo',
            },
          },
        },
      };
      const bodyInput = createInput({}, event, testLogger);
      const request = createAppRequestClient(bodyInput);
      const response = await request({
        url: `${HTTPBIN_URL}/post`,
        method: 'POST',
        body: {
          streetAddress: '{{bundle.inputData.address.street}}',
          city: '{{bundle.inputData.address.city}}',
        },
        // Set `replace` to true to make it act like a shorthand request
        replace: true,
      });

      const { json } = response.data;
      json.streetAddress.should.eql('123 Zapier Way');
      json.city.should.eql('El Mundo');
    });

    it('should resolve all bundle fields', async () => {
      const event = {
        bundle: {
          inputData: {
            resourceId: 123,
          },
          authData: {
            access_token: 'Let me in',
          },
          meta: {
            limit: 20,
          },
        },
      };
      const bodyInput = createInput({}, event, testLogger);
      const request = createAppRequestClient(bodyInput);
      const response = await request({
        url: `${HTTPBIN_URL}/get`,
        method: 'GET',
        params: {
          limit: '{{bundle.meta.limit}}',
          id: '{{bundle.inputData.resourceId}}',
        },
        headers: {
          Authorization: 'Bearer {{bundle.authData.access_token}}',
          'x-api-key': '{{bundle.authData.access_token}}',
          'x-cool': '{{bundle.authData.access_token}}',
          'x-another': '{{bundle.authData.access_token}}',
        },
        // Set `replace` to true to make it act like a shorthand request
        replace: true,
      });

      const { headers } = response.data;
      const { url } = JSON.parse(response.content);
      url.should.eql(`${HTTPBIN_URL}/get?limit=20&id=123`);
      headers.Authorization.should.deepEqual(['Bearer Let me in']);
      // covers the case where replacing the same value in multiple places didn't work
      headers['X-Api-Key'].should.deepEqual(['Let me in']);
      headers['X-Cool'].should.deepEqual(['Let me in']);
      headers['X-Another'].should.deepEqual(['Let me in']);
    });

    it('should be able to interpolate arrays/objects to a string', async () => {
      const event = {
        bundle: {
          inputData: {
            arr: [1, 2, 3, 'red', 'blue'],
            obj: {
              id: '456',
              name: 'John',
            },
            str: 'hello',
          },
        },
      };
      const bodyInput = createInput({}, event, testLogger);
      const request = createAppRequestClient(bodyInput);
      const response = await request({
        url: `${HTTPBIN_URL}/post`,
        method: 'POST',
        body: {
          arr: 'arr: {{bundle.inputData.arr}}',
          obj: 'obj: {{bundle.inputData.obj}}',
          str: 'str: {{bundle.inputData.str}}',
        },
        serializeValueForCurlies: (value) => {
          if (Array.isArray(value)) {
            return value.join(',');
          } else if (_.isPlainObject(value)) {
            return Object.entries(value)
              .map(([k, v]) => `${k}=${v}`)
              .join(',');
          }
          return value;
        },
        // Set `replace` to true to make it act like a shorthand request
        replace: true,
      });

      response.data.json.should.deepEqual({
        arr: 'arr: 1,2,3,red,blue',
        obj: 'obj: id=456,name=John',
        str: 'str: hello',
      });
    });
  });
});
