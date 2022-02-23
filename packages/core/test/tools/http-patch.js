'use strict';

const EventEmitter = require('events');

const should = require('should');

const createAppTester = require('../../src/tools/create-app-tester');
const createHttpPatch = require('../../src/tools/create-http-patch');
const appDefinition = require('../userapp');

describe('create-lambda-handler', () => {
  describe('http patch', () => {
    it('should patch by default', async () => {
      const appTester = createAppTester(appDefinition);
      await appTester(appDefinition.resources.list.list.operation.perform);
      const http = require('http'); // core modules are never cached
      should(http.patchedByZapier).eql(true);
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

    // this test is skipped because there's no way to un-modify 'http' once
    // we've done it I've verified that the bottom test works in isolation, but
    // doesn't when it's part of the larger suite
    it.skip('should be ablet opt out of patch', async () => {
      const appTester = createAppTester({
        ...appDefinition,
        flags: { skipHttpPatch: true },
      });
      await appTester(appDefinition.resources.list.list.operation.perform);
      const http = require('http'); // core modules are never cached
      should(http.patchedByZapier).eql(undefined);
    });
  });
});
