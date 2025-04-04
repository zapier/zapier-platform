'use strict';
const should = require('should');

const createApp = require('../src/create-app');
const createInput = require('../src/tools/create-input');
const dataTools = require('../src/tools/data');
const {
  FAKE_S3_URL,
  makeRpc,
  mockRpcGetPresignedPostCall,
  mockUpload,
} = require('./tools/mocky');
const exampleAppDefinition = require('./userapp');

describe('app middleware', () => {
  const createTestInput = (method, appDefinition) => {
    const event = {
      bundle: {},
      method,
    };

    return createInput(appDefinition, event);
  };

  it('should support before middleware', (done) => {
    const appDefinition = dataTools.deepCopy(exampleAppDefinition);
    appDefinition.beforeApp = [
      (input) => {
        // Swap up context to point to a real method
        input._zapier.event.method = 'resources.list.list.operation.perform';
        return input;
      },
    ];
    const app = createApp(appDefinition);

    // Create the input to point to a non-existent method on the app
    // the before middleware is gonna re-route this to a real method
    const input = createTestInput(
      'something.that.does.not.exist',
      appDefinition,
    );

    app(input)
      .then((output) => {
        output.results.should.eql([{ id: 1234 }, { id: 5678 }]);
        done();
      })
      .catch(done);
  });

  it('should support after middleware', (done) => {
    const appDefinition = dataTools.deepCopy(exampleAppDefinition);
    appDefinition.afterApp = [
      (output) => {
        output.results = [{ id: 'something new' }];
        return output;
      },
    ];
    const app = createApp(appDefinition);

    // We are gonna invoke this method, but the after middleware is gonna
    // change the result returned to something else
    const input = createTestInput(
      'resources.list.list.operation.perform',
      appDefinition,
    );

    app(input)
      .then((output) => {
        output.results.should.eql([{ id: 'something new' }]);
        done();
      })
      .catch(done);
  });

  describe('large-response-cacher', async () => {
    it('should skip if results is undefined', async () => {
      const rpc = makeRpc();
      mockRpcGetPresignedPostCall('1234/foo.json');
      mockUpload();

      const appDefinition = dataTools.deepCopy(exampleAppDefinition);

      const app = createApp(appDefinition);

      // returns nothing
      const input = createTestInput(
        'resources.contact.create.operation.perform',
        appDefinition,
      );
      input._zapier.rpc = rpc;

      const output = await app(input);
      output.should.have.property('results');
      should(output.results).be.undefined();
    });
    it('after middleware should stash large payloads', async () => {
      const rpc = makeRpc();
      mockRpcGetPresignedPostCall('1234/foo.json');
      mockUpload();

      const appDefinition = dataTools.deepCopy(exampleAppDefinition);

      const app = createApp(appDefinition);

      // We are gonna invoke this method, but the after middleware is gonna
      // change the result returned to something else
      const input = createTestInput(
        'resources.really_big_response.list.operation.perform',
        appDefinition,
      );
      input._zapier.rpc = rpc;

      // set the payload autostash limit
      input._zapier.event.autostashPayloadOutputLimit = 11 * 1024 * 1024;

      const output = await app(input);
      output.resultsUrl.should.eql(`${FAKE_S3_URL}/1234/foo.json`);
    });

    it('should not stash if payload is bigger than autostash limit', async () => {
      const rpc = makeRpc();
      mockRpcGetPresignedPostCall('1234/foo.json');
      mockUpload();

      const appDefinition = dataTools.deepCopy(exampleAppDefinition);

      const app = createApp(appDefinition);

      // returns 10mb of response
      const input = createTestInput(
        'resources.really_big_response.list.operation.perform',
        appDefinition,
      );
      input._zapier.rpc = rpc;

      // set the payload autostash limit
      // this limit is lower than res, so do not stash, let it fail
      input._zapier.event.autostashPayloadOutputLimit = 8 * 1024 * 1024;

      const output = app(input);
      output.should.not.have.property('resultsUrl');
    });
    it('should always stash if autostash limit is -1', async () => {
      const rpc = makeRpc();
      mockRpcGetPresignedPostCall('/1234/foo.json');
      mockUpload();

      const appDefinition = dataTools.deepCopy(exampleAppDefinition);

      const app = createApp(appDefinition);

      // returns regular response
      const input = createTestInput(
        'resources.list.list.operation.perform',
        appDefinition,
      );
      input._zapier.rpc = rpc;

      // set the payload autostash limit
      input._zapier.event.autostashPayloadOutputLimit = -1;

      const output = await app(input);
      output.resultsUrl.should.eql(`${FAKE_S3_URL}/1234/foo.json`);
    });
    it('should not stash if limit is not defined', async () => {
      const rpc = makeRpc();
      mockRpcGetPresignedPostCall('1234/foo.json');
      mockUpload();

      const appDefinition = dataTools.deepCopy(exampleAppDefinition);

      const app = createApp(appDefinition);

      // returns regular response
      const input = createTestInput(
        'resources.list.list.operation.perform',
        appDefinition,
      );
      input._zapier.rpc = rpc;

      // omit setting the payload autostash limit

      const output = app(input);
      output.should.not.have.property('resultsUrl');

      // returns 10mb regular response
      const bigInputCall = createTestInput(
        'resources.really_big_response.list.operation.perform',
        appDefinition,
      );
      input._zapier.rpc = rpc;

      // omit setting the payload autostash limit

      const bigOutput = app(bigInputCall);
      bigOutput.should.not.have.property('resultsUrl');
    });
  });
});
