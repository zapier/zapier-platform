'use strict';

const should = require('should');

const { HTTPBIN_URL } = require('../constants');
const {
  FAKE_S3_URL,
  makeRpc,
  mockRpcGetPresignedPostCall,
  mockUpload,
} = require('./mocky');

const stashResponse = require('../../src/tools/create-response-stasher');
const createAppRequestClient = require('../../src/tools/create-app-request-client');
const createInput = require('../../src/tools/create-input');
const nock = require('nock');

describe('stash response', () => {
  const testLogger = () => Promise.resolve({});
  const rpc = makeRpc();

  const input = createInput({}, {}, testLogger, [], rpc);

  const request = createAppRequestClient(input);

  beforeEach(() => {
    nock.cleanAll();
  });

  it('should upload json response', async () => {
    mockRpcGetPresignedPostCall('1234/foo.json');
    mockUpload();

    const response = await request(`${HTTPBIN_URL}/json`);
    const data = JSON.stringify(response.json);
    const url = await stashResponse(input, data);
    should(url).eql(`${FAKE_S3_URL}/1234/foo.json`);

    const s3Response = await request({ url });
    should(s3Response.getHeader('content-type')).startWith('text/plain');
    const decoded = Buffer.from(s3Response.content, 'base64').toString();
    should(decoded).eql(data);
  });
  it('retries on failure', async () => {
    mockRpcGetPresignedPostCall('1234/foo.json');

    // Mock fail the first upload, then succeed
    nock(FAKE_S3_URL).post('/').reply(500, 'uh oh');
    mockUpload();

    const response = await request(`${HTTPBIN_URL}/json`);
    const data = JSON.stringify(response.json);
    const url = await stashResponse(input, data);
    should(url).eql(`${FAKE_S3_URL}/1234/foo.json`);

    const s3Response = await request({ url });
    const decoded = Buffer.from(s3Response.content, 'base64').toString();
    should(decoded).eql(data);
  });
  it('throws on persistent failures', async () => {
    mockRpcGetPresignedPostCall('1234/foo.json');

    // Mock fail the first upload, then succeed
    nock(FAKE_S3_URL)
      .post('/')
      .reply(500, 'uh oh')
      .post('/')
      .reply(500, 'uh oh')
      .post('/')
      .reply(500, 'uh oh')
      .post('/')
      .reply(500, 'uh oh');

    const response = await request(`${HTTPBIN_URL}/json`);
    const data = JSON.stringify(response.json);
    await stashResponse(input, data).should.be.rejectedWith(/uh oh/);
  });
});
