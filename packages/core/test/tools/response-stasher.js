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

describe('file upload', () => {
  const testLogger = () => Promise.resolve({});
  const rpc = makeRpc();
  const input = createInput({}, {}, testLogger);

  const request = createAppRequestClient(input);

  it('should upload json response', async () => {
    mockRpcGetPresignedPostCall('1234/foo.json');
    mockUpload();

    const response = await request(`${HTTPBIN_URL}/json`);
    const data = JSON.stringify(response.json);
    const url = await stashResponse(
      {
        _zapier: {
          rpc,
        },
      },
      data
    );
    should(url).eql(`${FAKE_S3_URL}/1234/foo.json`);

    const s3Response = await request({ url });
    should(s3Response.getHeader('content-type')).startWith('application/json');
    // should(s3Response.getHeader('content-disposition')).eql(
    //   'attachment; filename="unnamedfile.txt"'
    // );

    should(s3Response.content).eql(data);
  });
  // it('retries on failure', async () => {
  //   mockRpcGetPresignedPostCall('1234/foo.json');
  //   mockUpload()
  //   const response = await request(`${HTTPBIN_URL}/json`);
  //   const data = JSON.stringify(response.json)
  //   const url = await stashResponse({
  //     _zapier: {
  //       rpc,
  //     },
  //   }, data);
  //   should(url).eql(`${FAKE_S3_URL}/1234/foo.json`);

  //   // mockRpcFail()
  //   const s3Response = await request({ url});
  //   should(await s3Response.text()).eql(data);
  // });
});
