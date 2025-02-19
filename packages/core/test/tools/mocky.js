const Dicer = require('dicer');
const nock = require('nock');

const createRpcClient = require('../../src/tools/create-rpc-client');

const FAKE_ZAPIER_URL = 'https://mock.zapier.com';
const FAKE_S3_URL = 'https://s3-fake.zapier.com';

const FAKE_LOG_URL = 'https://fake-logger.zapier.com';

const RPC_URL_PATH = '/platform/rpc/cli';

// Stores logs produced by the mocked log server
const logbox = [];

const makeRpc = () => {
  return createRpcClient({
    rpc_base: `${FAKE_ZAPIER_URL}${RPC_URL_PATH}`,
    token: 'debug:4001:1',
    storeKey: 'test_key',
  });
};

const mockRpcCall = (result) => {
  nock(FAKE_ZAPIER_URL)
    .post(RPC_URL_PATH)
    .reply(200, (uri, requestBody) => {
      const id = JSON.parse(requestBody).id;
      return { result, id };
    });
};

const mockRpcGetPresignedPostCall = (key) => {
  nock(FAKE_ZAPIER_URL)
    .post(RPC_URL_PATH)
    .reply(200, (uri, requestBody) => {
      const id = JSON.parse(requestBody).id;
      return {
        id,
        result: {
          url: FAKE_S3_URL,
          fields: {
            key,
            policy: 'bm8gZHJhbWE=',
            AWSAccessKeyId: 'AKIAIKIAAKIAIKIAAKIA',
            acl: 'public-read',
            signature: 'c4GzkaCtrc0ruvbZh6aSmf/1k=',
          },
        },
      };
    });
};

const mockRpcFail = (error, status = 400) => {
  nock(FAKE_ZAPIER_URL)
    .post(RPC_URL_PATH)
    .reply(status, (uri, requestBody) => {
      const id = JSON.parse(requestBody).id;
      return { error, id };
    });
};

// A quick and dirty way to emulate how S3 parses presigned post data
const parsePresignedPostData = (requestBody, contentType) => {
  const boundary = /;boundary=([^\s]+)/i.exec(contentType)[1];
  const d = new Dicer({ boundary });
  return new Promise((resolve, reject) => {
    const result = {};
    d.on('part', function (p) {
      const part = {
        key: null,
        value: null,
      };
      p.on('header', function (header) {
        Object.entries(header).forEach(([key, value]) => {
          if (key === 'content-disposition') {
            value = value[0];
            if (value.startsWith('form-data;')) {
              part.key = /name="([^"]+)"/i.exec(value)[1];
            }
          }
        });
      })
        .on('data', function (data) {
          if (part.key === 'file') {
            part.value = data;
          } else {
            part.value = data.toString();
          }
        })
        .on('end', function () {
          if (part.key) {
            result[part.key] = part.value;
          }
        });
    })
      .on('finish', function () {
        resolve(result);
      })
      .on('error', function (error) {
        reject(error);
      });

    d.end(requestBody);
  });
};

const isHexString = (str) => {
  const c0 = '0'.charCodeAt(0);
  const cz = 'z'.charCodeAt(0);
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < c0 || c > cz) {
      return false;
    }
  }
  return true;
};

const decodeStringToBuffer = (str) => {
  const encoding = isHexString(str) ? 'hex' : 'utf8';
  return Buffer.from(str, encoding);
};

// Emulates how S3 handles file uploads and downloads
const mockUpload = () => {
  // Mock file upload
  nock(FAKE_S3_URL)
    .post('/')
    .reply(function (uri, requestBody, cb) {
      const contentType = this.req.headers['content-type'][0];
      // nock always coerces request body to a string, either in hex or utf8.
      // We want raw binary data here so we need to decode it back to Buffer.
      requestBody = decodeStringToBuffer(requestBody, contentType);

      const contentLength = parseInt(this.req.headers['content-length'][0]);
      if (requestBody.length !== contentLength) {
        // This is what S3 gives you when the lengths don't match
        cb(null, [400, 'MalformedPOSTRequest']);
        return;
      }

      parsePresignedPostData(requestBody, contentType)
        .then(function (result) {
          // Mock file download
          nock(FAKE_S3_URL).get(`/${result.key}`).reply(200, result.file, {
            'Content-Disposition': result['Content-Disposition'],
            'Content-Length': result.file.length,
            'Content-Type': result['Content-Type'],
          });
          cb(null, [204, '']);
        })
        .catch(function (error) {
          cb(null, [400, error.toString()]);
        });
    });
};

const mockLogServer = (delay = 0) => {
  nock(FAKE_LOG_URL)
    .post('/input')
    .delay(delay)
    .reply(function (uri, requestBody, cb) {
      const lines = requestBody.split('\n');
      const logs = lines
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));

      for (const log of logs) {
        logbox.push(log);
      }

      cb(null, [
        200,
        {
          contentType: this.req.headers['content-type'][0],
          token: this.req.headers['x-token'][0],
          logs,
        },
      ]);
    });
};

const getLogs = () => logbox;

const clearLogs = () => {
  logbox.length = 0;
};

module.exports = {
  clearLogs,
  getLogs,
  makeRpc,
  mockLogServer,
  mockRpcCall,
  mockRpcFail,
  mockRpcGetPresignedPostCall,
  mockUpload,
  FAKE_LOG_URL,
  FAKE_S3_URL,
};
