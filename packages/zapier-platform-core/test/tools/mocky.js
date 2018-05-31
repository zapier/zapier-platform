const nock = require('nock');

const createRpcClient = require('../../src/tools/create-rpc-client');

const makeRpc = () => {
  return createRpcClient({
    rpc_base: 'http://mock.zapier.com/platform/rpc/cli',
    token: 'debug:4001:1',
    storeKey: 'test_key'
  });
};

const mockRpcCall = result => {
  nock('http://mock.zapier.com')
    .post('/platform/rpc/cli')
    .reply(200, (uri, requestBody) => {
      const id = JSON.parse(requestBody).id;
      return { result: result, id };
    });
};

const mockRpcFail = error => {
  nock('http://mock.zapier.com')
    .post('/platform/rpc/cli')
    .reply(500, (uri, requestBody) => {
      const id = JSON.parse(requestBody).id;
      return { error: error, id };
    });
};

const fakeSignedPostData = {
  url: 'http://s3-fake.zapier.com/',
  fields: {
    policy: 'bm8gZHJhbWE=',
    AWSAccessKeyId: 'AKIAIKIAAKIAIKIAAKIA',
    acl: 'public-read',
    key: 'some-route/d362f087-1106-4847-9261-669ec340b580',
    signature: 'c4GzkaCtrc0ruvbZh6aSmf/1k='
  }
};

const mockUpload = () => {
  nock('http://s3-fake.zapier.com')
    .post('/')
    .reply(204, '');
};

module.exports = {
  makeRpc,
  mockRpcCall,
  mockRpcFail,
  fakeSignedPostData,
  mockUpload
};
