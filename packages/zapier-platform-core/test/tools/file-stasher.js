'use strict';

const fs = require('fs');
const path = require('path');

const should = require('should');
const nock = require('nock');

const mocky = require('./mocky');

const createFileStasher = require('../../src/tools/create-file-stasher');
const createAppRequestClient = require('../../src/tools/create-app-request-client');
const createInput = require('../../src/tools/create-input');

describe('file upload', () => {
  const testLogger = () => Promise.resolve({});
  const input = createInput({}, {}, testLogger);

  const rpc = mocky.makeRpc();
  const stashFile = createFileStasher({
    _zapier: {
      rpc,
      event: {
        method: 'hydrators.test'
      }
    }
  });

  it('should upload a standard blob of text', done => {
    mocky.mockRpcCall(mocky.fakeSignedPostData);
    mocky.mockUpload();

    const file = 'hello world this is a plain blob of text';
    stashFile(file)
      .then(url => {
        should(url).eql(
          `${mocky.fakeSignedPostData.url}${
            mocky.fakeSignedPostData.fields.key
          }`
        );
        done();
      })
      .catch(done);
  });

  it('should upload a standard buffer of text', done => {
    mocky.mockRpcCall(mocky.fakeSignedPostData);
    mocky.mockUpload();

    const file = Buffer.from('hello world this is a buffer of text');
    stashFile(file)
      .then(url => {
        should(url).eql(
          `${mocky.fakeSignedPostData.url}${
            mocky.fakeSignedPostData.fields.key
          }`
        );
        done();
      })
      .catch(done);
  });

  it('should fail a standard file stream of text with no length', done => {
    mocky.mockRpcCall(mocky.fakeSignedPostData);

    // known failure when "You must provide the Content-Length HTTP header."
    // doesn't support naive "Transfer-Encoding: chunked" ...
    // so purposefully provde knownLength - maybe we could consume/buffer?
    const file = fs.createReadStream(path.join(__dirname, 'test.txt'));
    stashFile(file)
      .then(() => done(new Error('this should have exploded')))
      .catch(err => {
        should(err.message).containEql('knownLength');
        done();
      })
      .catch(done);
  });

  it('should upload a standard file stream of text', done => {
    mocky.mockRpcCall(mocky.fakeSignedPostData);
    mocky.mockUpload();

    const file = fs.createReadStream(path.join(__dirname, 'test.txt'));
    const knownLength = fs.readFileSync(path.join(__dirname, 'test.txt'))
      .length;
    stashFile(file, knownLength)
      .then(url => {
        should(url).eql(
          `${mocky.fakeSignedPostData.url}${
            mocky.fakeSignedPostData.fields.key
          }`
        );
        done();
      })
      .catch(done);
  });

  it('should upload a raw response', done => {
    mocky.mockRpcCall(mocky.fakeSignedPostData);
    mocky.mockUpload();

    const request = createAppRequestClient(input);
    const file = request(
      'http://zapier-httpbin.herokuapp.com/stream-bytes/1024',
      { raw: true }
    );
    stashFile(file)
      .then(url => {
        should(url).eql(
          `${mocky.fakeSignedPostData.url}${
            mocky.fakeSignedPostData.fields.key
          }`
        );
        done();
      })
      .catch(done);
  });

  it('should throwForStatus if bad status', done => {
    mocky.mockRpcCall(mocky.fakeSignedPostData);
    mocky.mockUpload();

    nock('http://example.com')
      .get('/stream-bytes')
      .reply(401);

    const request = createAppRequestClient(input);
    const file = request({
      url: 'http://example.com/stream-bytes',
      raw: true
    });
    stashFile(file)
      .catch(err => {
        should(err.message).containEql('Received 401 code from');
        done();
      })
      .catch(done);
  });

  it('should upload a resolved buffer', done => {
    mocky.mockRpcCall(mocky.fakeSignedPostData);
    mocky.mockUpload();

    const file = Promise.resolve().then(() =>
      Buffer.from('7468697320697320612074c3a97374', 'hex')
    );

    stashFile(file)
      .then(url => {
        should(url).eql(
          `${mocky.fakeSignedPostData.url}${
            mocky.fakeSignedPostData.fields.key
          }`
        );
        done();
      })
      .catch(done);
  });

  it('should fail if being called from a trigger event', done => {
    const pollingStashFile = createFileStasher({
      _zapier: {
        rpc,
        event: {
          method: 'triggers.test.operation.perform'
        }
      }
    });

    const file = fs.createReadStream(path.join(__dirname, 'test.txt'));
    pollingStashFile(file)
      .then(() => done(new Error('this should have exploded')))
      .catch(err => {
        should(err.message).containEql(
          'Files can only be stashed within a create or hydration function/method'
        );
        done();
      })
      .catch(done);
  });

  it('should fail if being called from a search event', done => {
    const stashFileTest = createFileStasher({
      _zapier: {
        rpc,
        event: {
          method: 'search.test.operation.perform'
        }
      }
    });

    const file = fs.createReadStream(path.join(__dirname, 'test.txt'));
    stashFileTest(file)
      .then(() => done(new Error('this should have exploded')))
      .catch(err => {
        should(err.message).containEql(
          'Files can only be stashed within a create or hydration function/method'
        );
        done();
      })
      .catch(done);
  });

  it('should work if being called from a create/action event', done => {
    mocky.mockRpcCall(mocky.fakeSignedPostData);
    mocky.mockUpload();

    const stashFileTest = createFileStasher({
      _zapier: {
        rpc,
        event: {
          method: 'creates.test.operation.perform'
        }
      }
    });

    const file = 'hello world this is a plain blob of text';
    stashFileTest(file)
      .then(url => {
        should(url).eql(
          `${mocky.fakeSignedPostData.url}${
            mocky.fakeSignedPostData.fields.key
          }`
        );
        done();
      })
      .catch(done);
  });

  it('should get filename from content-disposition', done => {
    mocky.mockRpcCall(mocky.fakeSignedPostData);

    // Expect to have this part in the request body sent to S3
    mocky.mockUpload(
      /name="Content-Disposition"\r\n\r\nattachment; filename="an example\.json"/
    );

    const request = createAppRequestClient(input);
    const file = request({
      url: 'https://zapier-httpbin.herokuapp.com/response-headers',
      params: {
        'Content-Disposition': 'inline; filename="an example.json"'
      },
      raw: true
    });
    stashFile(file)
      .then(url => {
        should(url).eql(
          `${mocky.fakeSignedPostData.url}${
            mocky.fakeSignedPostData.fields.key
          }`
        );
        done();
      })
      .catch(done);
  });
});
