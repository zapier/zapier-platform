'use strict';

const EventEmitter = require('events');
const https = require('node:https');

const should = require('should');

const {
  BINARY_TYPE,
  JSON_TYPE,
  TEXT_TYPE,
  XML_TYPE,
} = require('../../src/tools/http');
const createAppTester = require('../../src/tools/create-app-tester');
const createHttpPatch = require('../../src/tools/create-http-patch');
const appDefinition = require('../userapp');
const { HTTPBIN_URL } = require('../constants');

describe('create http patch', () => {
  it('should patch by default', async () => {
    const appTester = createAppTester(appDefinition);
    await appTester(appDefinition.resources.list.list.operation.perform);
    should(require('http').patchedByZapier).eql(true);
    should(require('https').patchedByZapier).eql(true);
  });

  it('should use new logger every call', () => {
    const fakeHttpModule = {
      request: (options, callback) => {
        const res = new EventEmitter();
        res.statusCode = 418;
        res.headers = {};
        callback(res);
        res.emit('end');
      },
    };

    const logger1Buffer = [];
    const logger2Buffer = [];

    const logger1 = (msg) => {
      logger1Buffer.push(msg);
    };
    const logger2 = (msg) => {
      logger2Buffer.push(msg);
    };

    const httpPatch = createHttpPatch({});

    httpPatch(fakeHttpModule, logger1);
    fakeHttpModule.request('https://fake.zapier.com/foo');
    should(logger1Buffer).deepEqual(['418 GET https://fake.zapier.com/foo']);

    // For the second call to httpPatch, it should completely forget logger1
    // and use logger2
    httpPatch(fakeHttpModule, logger2);
    fakeHttpModule.request('https://fake.zapier.com/bar');
    should(logger1Buffer).deepEqual(['418 GET https://fake.zapier.com/foo']);
    should(logger2Buffer).deepEqual(['418 GET https://fake.zapier.com/bar']);
  });

  it('should log request/response data for allowlisted content-types', () => {
    // Arrange
    const fakeHttpModule = {
      request: (options, callback) => {
        const res = new EventEmitter();

        // Response data
        res.statusCode = 200;
        res.headers = { 'content-type': XML_TYPE }; // XML type should be supported
        callback(res);
        res.emit('data', Buffer.from('<foo>bar</foo>'));
        res.emit('end');
      },
    };

    const logBuffer = [];

    const stubLogger = (_, data) => {
      logBuffer.push(data);
    };

    const httpPatch = createHttpPatch({});
    httpPatch(fakeHttpModule, stubLogger);

    // Act
    fakeHttpModule.request({
      url: 'https://fake.zapier.com/foo',
      body: JSON.stringify({ input: 'data' }),
      headers: { 'content-type': JSON_TYPE }, // JSON type should be supported
    });

    // Assert
    should(logBuffer).deepEqual([
      {
        log_type: 'http',
        request_data: '{"input":"data"}',
        request_headers: { 'content-type': JSON_TYPE },
        request_method: 'GET',
        request_type: 'patched-devplatform-outbound',
        request_url: 'https://fake.zapier.com/foo',
        request_via_client: false,
        response_content: '<foo>bar</foo>',
        response_headers: {
          'content-type': 'application/xml',
        },
        response_status_code: 200,
      },
    ]);
  });

  it('should log request/response data when content-type header is array', () => {
    // Arrange
    const fakeHttpModule = {
      request: (options, callback) => {
        const res = new EventEmitter();

        // Response data
        res.statusCode = 200;
        res.headers = { 'content-type': [XML_TYPE] }; // XML type should be supported
        callback(res);
        res.emit('data', Buffer.from('<foo>bar</foo>'));
        res.emit('end');
      },
    };

    const logBuffer = [];
    const stubLogger = (_, data) => {
      logBuffer.push(data);
    };

    const httpPatch = createHttpPatch({});
    httpPatch(fakeHttpModule, stubLogger);

    // Act
    fakeHttpModule.request({
      url: 'https://fake.zapier.com/foo',
      body: JSON.stringify({ input: 'data' }),
      headers: { 'content-type': [JSON_TYPE] }, // JSON type should be supported
    });

    // Assert
    should(logBuffer).deepEqual([
      {
        log_type: 'http',
        request_data: '{"input":"data"}',
        request_headers: { 'content-type': [JSON_TYPE] },
        request_method: 'GET',
        request_type: 'patched-devplatform-outbound',
        request_url: 'https://fake.zapier.com/foo',
        request_via_client: false,
        response_content: '<foo>bar</foo>',
        response_headers: {
          'content-type': ['application/xml'],
        },
        response_status_code: 200,
      },
    ]);
  });

  it('should not log request/response data from non-allowlisted content-types', () => {
    // Arrange
    const fakeHttpModule = {
      request: (options, callback) => {
        const res = new EventEmitter();

        // Response data
        res.statusCode = 200;
        res.headers = { 'content-type': BINARY_TYPE }; // octet-stream data type is not
        callback(res);
        res.emit('data', Buffer.from('some binary data'));
        res.emit('end');
      },
    };

    const logBuffer = [];

    const stubLogger = (_, data) => {
      logBuffer.push(data);
    };

    const httpPatch = createHttpPatch({});
    httpPatch(fakeHttpModule, stubLogger);

    // Act
    fakeHttpModule.request({
      url: 'https://fake.zapier.com/foo',
      body: JSON.stringify({ input: 'data' }),
      headers: {}, // not sending content-type header
    });

    // Assert
    should(logBuffer).deepEqual([
      {
        log_type: 'http',
        request_data: '<unsupported format>',
        request_headers: {},
        request_method: 'GET',
        request_type: 'patched-devplatform-outbound',
        request_url: 'https://fake.zapier.com/foo',
        request_via_client: false,
        response_content: '<unsupported format>',
        response_headers: {
          'content-type': 'application/octet-stream',
        },
        response_status_code: 200,
      },
    ]);
  });

  it('should not cause missing bytes for late listener', (done) => {
    // Wrap https.request so httpPatch doesn't modify the real https module
    const fakeHttpModule = {
      request: (options, callback) => https.request(options, callback),
    };

    const logBuffer = [];
    const stubLogger = (_, data) => {
      logBuffer.push(data);
    };

    const httpPatch = createHttpPatch({});
    httpPatch(fakeHttpModule, stubLogger);

    const chunks = [];
    const req = fakeHttpModule.request(
      `${HTTPBIN_URL}/stream/50?chunk_size=100`,
      (res) => {
        // Make sure it's a response object
        should(res.statusCode).eql(200);
        should(res.headers['content-type']).containEql(TEXT_TYPE);

        setTimeout(() => {
          // Suppose this listener is some HTTP client library that consumes the
          // response stream. We use setTimeout to recreate the scenario where
          // the listener is attached AFTER the logger has already started
          // consuming the stream.
          res.on('data', (chunk) => {
            chunks.push(chunk);
          });
          res.on('end', () => {
            // Assert the library listener gets complete data without missing
            // bytes
            {
              // Make sure the endpoint did return more than one chunk.
              // Otherwise, we should switch to a different endpoint that does.
              should(chunks.length).above(1);

              const content = Buffer.concat(chunks).toString();
              const lines = content.split('\n').filter((line) => line);
              should(lines).have.length(50);

              for (let i = 0; i < lines.length; i++) {
                const obj = JSON.parse(lines[i]);
                should(obj.id).eql(i);
              }
            }
            // Assert the logger listener writes the log as expected
            {
              // One request, one log
              should(logBuffer).have.length(1);

              const log = logBuffer[0];
              should(log).containEql({
                log_type: 'http',
                request_data: '<unsupported format>',
                request_method: 'GET',
                request_type: 'patched-devplatform-outbound',
                request_url:
                  'https://httpbin.zapier-tooling.com/stream/50?chunk_size=100',
                request_via_client: false,
                response_status_code: 200,
              });

              // We've seen httpbin put a line break in the middle of a JSON
              // object, so we need to remove it before parsing.
              const responseContent = log.response_content.replaceAll('\n', '');
              const loggedIds = Array.from(
                responseContent.matchAll(/"id":(\d+)/g),
                (m) => m[1],
              );
              should(loggedIds).have.length(50);
              for (let i = 0; i < loggedIds.length; i++) {
                const id = parseInt(loggedIds[i]);
                should(id).eql(i);
              }
            }

            done();
          });
        });
      },
    );
    req.end();
  });

  // when we run this test, we have to run it without any other test calling createAppTester
  // this block is skipped because there's no way to un-modify 'http' once we've done it
  // it's skipped in the main suite and run on its own afterwards
  // if the test name changes, the test command in package.json must as well
  // console.error(process.env.OPT_OUT_PATCH_TEST_ONLY);
  (process.env.OPT_OUT_PATCH_TEST_ONLY ? it : it.skip)(
    'should be able to opt out of patch',
    async () => {
      const appTester = createAppTester({
        ...appDefinition,
        flags: { skipHttpPatch: true },
      });
      await appTester(appDefinition.resources.list.list.operation.perform);
      const http = require('http'); // core modules are never cached
      should(http.patchedByZapier).eql(undefined);
    },
  );
});
