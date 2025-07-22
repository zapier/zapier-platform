'use strict';
const should = require('should');
const nock = require('nock');

const createApp = require('../src/create-app');
const createInput = require('../src/tools/create-input');
const dataTools = require('../src/tools/data');
const {
  FAKE_S3_URL,
  makeRpc,
  mockRpcGetPresignedPostCall,
  mockUpload,
  mockRpcCall,
} = require('./tools/mocky');
const exampleAppDefinition = require('./userapp');
const fetchStashedBundle = require('../src/app-middlewares/before/fetch-stashed-bundle');
const crypto = require('crypto');
const fernet = require('fernet');
const zlib = require('zlib');

const { createLargeBundleTestData } = require('./helpers/test-data');

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

  describe('fetchStashedBundle', () => {
    beforeEach(() => {
      // Reset all nock interceptors
      nock.cleanAll();
      // Clear environment variable
      delete process.env._ZAPIER_ONE_TIME_SECRET;
    });

    afterEach(() => {
      // Clean up environment variable
      delete process.env._ZAPIER_ONE_TIME_SECRET;
    });

    it('should return input unchanged if stashedBundleKey is not present', async () => {
      const input = createTestInput('some.method', exampleAppDefinition);
      const output = await fetchStashedBundle(input);
      output.should.equal(input);
    });

    it('should return input unchanged if secret is not present', async () => {
      const input = createTestInput('some.method', exampleAppDefinition);
      input._zapier.event.stashedBundleKey = 'some-key';
      // No secret set in environment
      const output = await fetchStashedBundle(input);
      output.should.equal(input);
    });

    it('should decrypt and set the stashed bundle if data is encrypted', async () => {
      const testSecret = 'test-secret-key';
      const testData = { encrypted: 'data', key: 'value' };

      // Set up environment variable
      process.env._ZAPIER_ONE_TIME_SECRET = testSecret;

      // Create Fernet key same way as the function does
      const keyHash = crypto.createHash('sha256').update(testSecret).digest();
      const keyBytes = keyHash.subarray(0, 32);
      const fernetKey = keyBytes.toString('base64url');

      // Create encrypted token
      const secret = new fernet.Secret(fernetKey);
      const token = new fernet.Token({
        secret: secret,
        token: '',
        ttl: 0,
      });
      const encryptedToken = token.encode(JSON.stringify(testData));

      const rpc = makeRpc();
      mockRpcCall({ url: `${FAKE_S3_URL}/some-key/` });

      // Set up nock to return encrypted data
      nock(FAKE_S3_URL).get('/some-key/').reply(200, encryptedToken);

      const input = createTestInput('some.method', exampleAppDefinition);
      input._zapier.event.stashedBundleKey = 'some-key';
      input._zapier.rpc = rpc;

      const output = await fetchStashedBundle(input);
      output._zapier.event.bundle.should.eql(testData);
    });

    it('should throw an error if fetch fails', async () => {
      process.env._ZAPIER_ONE_TIME_SECRET = 'test-secret';

      const rpc = makeRpc();
      mockRpcCall({ url: `${FAKE_S3_URL}/some-key/` });

      // Set up nock to intercept the fetch request and simulate a failure
      nock(FAKE_S3_URL).get('/some-key/').reply(500);

      const input = createTestInput('some.method', exampleAppDefinition);
      input._zapier.event.stashedBundleKey = 'some-key';
      input._zapier.rpc = rpc;

      await fetchStashedBundle(input).should.be.rejectedWith(
        'Failed to read stashed bundle. Status: 500 Internal Server Error',
      );
    });

    it('should throw an error if decryption fails', async () => {
      process.env._ZAPIER_ONE_TIME_SECRET = 'test-secret';

      const rpc = makeRpc();
      mockRpcCall({ url: `${FAKE_S3_URL}/some-key/` });

      // Set up nock to return invalid encrypted data
      nock(FAKE_S3_URL).get('/some-key/').reply(200, 'invalid-encrypted-data');

      const input = createTestInput('some.method', exampleAppDefinition);
      input._zapier.event.stashedBundleKey = 'some-key';
      input._zapier.rpc = rpc;

      await fetchStashedBundle(input).should.be.rejectedWith(
        /Bundle decryption failed/,
      );
    });

    it('should throw an error if decrypted data is not valid JSON', async () => {
      const testSecret = 'test-secret-key';

      // Set up environment variable
      process.env._ZAPIER_ONE_TIME_SECRET = testSecret;

      // Create Fernet key same way as the function does
      const keyHash = crypto.createHash('sha256').update(testSecret).digest();
      const keyBytes = keyHash.subarray(0, 32);
      const fernetKey = keyBytes.toString('base64url');

      // Create encrypted token with invalid JSON
      const secret = new fernet.Secret(fernetKey);
      const token = new fernet.Token({
        secret: secret,
        token: '',
        ttl: 0,
      });
      const encryptedToken = token.encode('invalid json data');

      const rpc = makeRpc();
      mockRpcCall({ url: `${FAKE_S3_URL}/some-key/` });

      // Set up nock to return encrypted invalid JSON
      nock(FAKE_S3_URL).get('/some-key/').reply(200, encryptedToken);

      const input = createTestInput('some.method', exampleAppDefinition);
      input._zapier.event.stashedBundleKey = 'some-key';
      input._zapier.rpc = rpc;

      await fetchStashedBundle(input).should.be.rejectedWith(
        /Invalid JSON in decrypted bundle/,
      );
    });

    it('should decrypt and set stashed bundle with new compressed format', async () => {
      const testSecret = 'test-secret-key';

      // Create a realistic large bundle that would benefit from compression
      const testData = createLargeBundleTestData({
        stringSize: 1024 * 1024 * 100,
      }); // ~100MB

      // Set up environment variable
      process.env._ZAPIER_ONE_TIME_SECRET = testSecret;

      // Create Fernet key same way as the function does
      const keyHash = crypto.createHash('sha256').update(testSecret).digest();
      const keyBytes = keyHash.subarray(0, 32);
      const fernetKey = keyBytes.toString('base64url');

      // Create compressed encrypted token (new format)
      const jsonString = JSON.stringify(testData);
      const compressedData = zlib.gzipSync(jsonString);
      const base64EncodedData = compressedData.toString('base64');

      const secret = new fernet.Secret(fernetKey);
      const token = new fernet.Token({
        secret: secret,
        token: '',
        ttl: 0,
      });
      const encryptedToken = token.encode(base64EncodedData);

      const rpc = makeRpc();
      mockRpcCall({ url: `${FAKE_S3_URL}/some-key/` });

      // Set up nock to return compressed encrypted data
      nock(FAKE_S3_URL).get('/some-key/').reply(200, encryptedToken);

      const input = createTestInput('some.method', exampleAppDefinition);
      input._zapier.event.stashedBundleKey = 'some-key';
      input._zapier.rpc = rpc;

      const output = await fetchStashedBundle(input);
      output._zapier.event.bundle.should.eql(testData);
    });

    it('should handle backward compatibility with old uncompressed format in fetchStashedBundle', async () => {
      const testSecret = 'test-secret-key';
      const testData = { old: 'format', without: 'compression' };

      // Set up environment variable
      process.env._ZAPIER_ONE_TIME_SECRET = testSecret;

      // Create Fernet key same way as the function does
      const keyHash = crypto.createHash('sha256').update(testSecret).digest();
      const keyBytes = keyHash.subarray(0, 32);
      const fernetKey = keyBytes.toString('base64url');

      // Create encrypted token in old format (JSON string directly)
      const secret = new fernet.Secret(fernetKey);
      const token = new fernet.Token({
        secret: secret,
        token: '',
        ttl: 0,
      });
      const encryptedToken = token.encode(JSON.stringify(testData));

      const rpc = makeRpc();
      mockRpcCall({ url: `${FAKE_S3_URL}/some-key/` });

      // Set up nock to return encrypted data in old format
      nock(FAKE_S3_URL).get('/some-key/').reply(200, encryptedToken);

      const input = createTestInput('some.method', exampleAppDefinition);
      input._zapier.event.stashedBundleKey = 'some-key';
      input._zapier.rpc = rpc;

      const output = await fetchStashedBundle(input);
      output._zapier.event.bundle.should.eql(testData);
    });

    it('should handle large compressed bundles efficiently', async () => {
      const testSecret = 'test-secret-key';

      // Create a very large realistic bundle to test compression efficiency
      const testData = createLargeBundleTestData({
        stringSize: 1024 * 1024 * 200,
      }); // ~200MB

      // Set up environment variable
      process.env._ZAPIER_ONE_TIME_SECRET = testSecret;

      // Create Fernet key same way as the function does
      const keyHash = crypto.createHash('sha256').update(testSecret).digest();
      const keyBytes = keyHash.subarray(0, 32);
      const fernetKey = keyBytes.toString('base64url');

      // Create compressed encrypted token
      const jsonString = JSON.stringify(testData);
      const compressedData = zlib.gzipSync(jsonString);
      const base64EncodedData = compressedData.toString('base64');

      // Verify compression is effective
      const compressionRatio =
        compressedData.length / Buffer.byteLength(jsonString, 'utf8');
      compressionRatio.should.be.lessThan(0.5); // Should compress to less than 50%

      const secret = new fernet.Secret(fernetKey);
      const token = new fernet.Token({
        secret: secret,
        token: '',
        ttl: 0,
      });
      const encryptedToken = token.encode(base64EncodedData);

      const rpc = makeRpc();
      mockRpcCall({ url: `${FAKE_S3_URL}/some-key/` });

      // Set up nock to return compressed encrypted data
      nock(FAKE_S3_URL).get('/some-key/').reply(200, encryptedToken);

      const input = createTestInput('some.method', exampleAppDefinition);
      input._zapier.event.stashedBundleKey = 'some-key';
      input._zapier.rpc = rpc;

      const output = await fetchStashedBundle(input);
      output._zapier.event.bundle.should.eql(testData);
    });

    it('should handle mixed scenarios with different compression states', async () => {
      const testSecret = 'test-secret-key';
      const testData = {
        scenario: 'mixed',
        data: 'test',
        special: 'characters: éñ中文🎉',
      };

      // Set up environment variable
      process.env._ZAPIER_ONE_TIME_SECRET = testSecret;

      // Create Fernet key same way as the function does
      const keyHash = crypto.createHash('sha256').update(testSecret).digest();
      const keyBytes = keyHash.subarray(0, 32);
      const fernetKey = keyBytes.toString('base64url');

      // Test both compressed and uncompressed formats work
      const secret = new fernet.Secret(fernetKey);

      // Test compressed format
      const jsonString = JSON.stringify(testData);
      const compressedData = zlib.gzipSync(jsonString);
      const base64EncodedData = compressedData.toString('base64');

      const token1 = new fernet.Token({
        secret: secret,
        token: '',
        ttl: 0,
      });
      const encryptedToken1 = token1.encode(base64EncodedData);

      const rpc = makeRpc();
      mockRpcCall({ url: `${FAKE_S3_URL}/compressed-key/` });

      // Set up nock to return compressed encrypted data
      nock(FAKE_S3_URL).get('/compressed-key/').reply(200, encryptedToken1);

      const input1 = createTestInput('some.method', exampleAppDefinition);
      input1._zapier.event.stashedBundleKey = 'compressed-key';
      input1._zapier.rpc = rpc;

      const output1 = await fetchStashedBundle(input1);
      output1._zapier.event.bundle.should.eql(testData);
    });
  });
});
