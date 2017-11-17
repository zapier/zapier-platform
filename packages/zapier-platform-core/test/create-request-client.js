'use strict';

const should = require('should');

const fs = require('fs');
const path = require('path');

const createAppRequestClient = require('../src/tools/create-app-request-client');
const createInput = require('../src/tools/create-input');

describe('request client', () => {
  const testLogger = () => Promise.resolve({});
  const input = createInput({}, {}, testLogger);

  it('should include a user-agent header', (done) => {
    const request = createAppRequestClient(input);
    request({url: 'http://zapier-httpbin.herokuapp.com/get'})
      .then(responseBefore => {
        const response = JSON.parse(JSON.stringify(responseBefore));

        response.request.headers['user-agent'].should.eql('Zapier');
        response.status.should.eql(200);

        const body = JSON.parse(response.content);
        body.url.should.eql('http://zapier-httpbin.herokuapp.com/get');
        done();
      })
      .catch(done);
  });

  it('should allow overriding the user-agent header', (done) => {
    const request = createAppRequestClient(input);
    request({
      url: 'http://zapier-httpbin.herokuapp.com/get',
      headers: {
        'User-Agent': 'Zapier!',
      },
    })
      .then(responseBefore => {
        const response = JSON.parse(JSON.stringify(responseBefore));

        should(response.request.headers['user-agent']).eql(undefined);
        response.request.headers['User-Agent'].should.eql('Zapier!');
        response.status.should.eql(200);

        const body = JSON.parse(response.content);
        body.url.should.eql('http://zapier-httpbin.herokuapp.com/get');
        done();
      })
      .catch(done);
  });

  it('should have json serializable response', (done) => {
    const request = createAppRequestClient(input);
    request({url: 'http://zapier-httpbin.herokuapp.com/get'})
      .then(responseBefore => {
        const response = JSON.parse(JSON.stringify(responseBefore));

        response.headers['content-type'].should.eql('application/json');
        response.status.should.eql(200);

        const body = JSON.parse(response.content);
        body.url.should.eql('http://zapier-httpbin.herokuapp.com/get');
        done();
      })
      .catch(done);
  });

  it('should wrap a request entirely', (done) => {
    const request = createAppRequestClient(input);
    request({url: 'http://zapier-httpbin.herokuapp.com/get'})
      .then(response => {
        response.status.should.eql(200);
        const body = JSON.parse(response.content);
        body.url.should.eql('http://zapier-httpbin.herokuapp.com/get');
        done();
      })
      .catch(done);
  });

  it('should support promise bodies', (done) => {
    const payload = {hello: 'world is nice'};
    const request = createAppRequestClient(input);
    request({
      method: 'POST',
      url: 'http://zapier-httpbin.herokuapp.com/post',
      body: Promise.resolve(payload),
    })
      .then(response => {
        response.status.should.eql(200);
        response.request.body.should.eql(JSON.stringify(payload));
        const body = JSON.parse(response.content);
        body.data.should.eql(JSON.stringify(payload));
        done();
      })
      .catch(done);
  });

  it('should support streaming another request', (done) => {
    const fileUrl = 'https://s3.amazonaws.com/zapier-downloads/just-a-few-lines.txt';
    const fileExpectedContent = '0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15\n16\n17\n18\n19\n20\n21\n22\n23\n24\n25\n26\n27\n28\n29\n30\n';
    const request = createAppRequestClient(input);
    request({
      method: 'POST',
      url: 'http://zapier-mockbin.herokuapp.com/request', // httpbin doesn't handle chunked anything :-(
      body: request({url: fileUrl, raw: true}),
    })
      .then(response => {
        response.status.should.eql(200);
        const body = JSON.parse(response.content);
        body.postData.text.should.eql(fileExpectedContent);
        done();
      })
      .catch(done);
  });

  it('should handle a buffer upload fine', (done) => {
    const request = createAppRequestClient(input);
    request({
      method: 'POST',
      url: 'http://zapier-mockbin.herokuapp.com/request', // httpbin doesn't handle chunked anything :-(
      body: new Buffer('hello world this is a cat (=^..^=)'),
    })
      .then(response => {
        response.status.should.eql(200);
        const body = JSON.parse(response.content);
        body.postData.text.should.eql('hello world this is a cat (=^..^=)');
        done();
      })
      .catch(done);
  });

  it('should handle a stream upload fine', (done) => {
    const request = createAppRequestClient(input);
    request({
      method: 'POST',
      url: 'http://zapier-mockbin.herokuapp.com/request', // httpbin doesn't handle chunked anything :-(
      body: fs.createReadStream(path.join(__dirname, 'test.txt')),
    })
      .then(response => {
        response.status.should.eql(200);
        const body = JSON.parse(response.content);
        body.postData.text.should.eql('hello world this is a cat (=^..^=)');
        done();
      })
      .catch(done);
  });

  it('should support single url param', (done) => {
    const request = createAppRequestClient(input);
    request('http://zapier-httpbin.herokuapp.com/get')
      .then(response => {
        response.status.should.eql(200);
        const body = JSON.parse(response.content);
        body.url.should.eql('http://zapier-httpbin.herokuapp.com/get');
        done();
      })
      .catch(done);
  });

  it('should support url param with options', (done) => {
    const request = createAppRequestClient(input);
    request('http://zapier-httpbin.herokuapp.com/get', {headers: {A: 'B'}})
      .then(response => {
        response.status.should.eql(200);
        const body = JSON.parse(response.content);
        body.url.should.eql('http://zapier-httpbin.herokuapp.com/get');
        body.headers.A.should.eql('B');
        done();
      })
      .catch(done);
  });

  it('should support bytes', (done) => {
    const request = createAppRequestClient(input);
    request('http://zapier-httpbin.herokuapp.com/bytes/1024')
      .then(response => {
        response.status.should.eql(200);
        // it tries to decode the bytes /shrug
        response.content.length.should.belowOrEqual(1024);
        done();
      })
      .catch(done);
  });

  it('should support bytes raw', (done) => {
    const request = createAppRequestClient(input);
    request('http://zapier-httpbin.herokuapp.com/bytes/1024', {raw: true})
      .then(response => {
        response.status.should.eql(200);
        should(response.buffer).be.type('function');
        should(response.text).be.type('function');
        should(response.body.pipe).be.type('function');
        done();
      })
      .catch(done);
  });

  it('should support streaming bytes', (done) => {
    const request = createAppRequestClient(input);
    request('http://zapier-httpbin.herokuapp.com/stream-bytes/1024')
      .then(response => {
        response.status.should.eql(200);
        // it tries to decode the bytes /shrug
        response.content.length.should.belowOrEqual(1024);
        done();
      })
      .catch(done);
  });

  it('should support streaming bytes raw', (done) => {
    const request = createAppRequestClient(input);
    request('http://zapier-httpbin.herokuapp.com/stream-bytes/1024', {raw: true})
      .then(response => {
        response.status.should.eql(200);
        should(response.buffer).be.type('function');
        should(response.text).be.type('function');
        should(response.body.pipe).be.type('function');
        done();
      })
      .catch(done);
  });

  it('should support streaming bytes raw as buffer', (done) => {
    const request = createAppRequestClient(input);
    request('http://zapier-httpbin.herokuapp.com/stream-bytes/1024', {raw: true})
      .then(response => {
        response.status.should.eql(200);
        return response.buffer();
      })
      .then(buffer => {
        buffer.length.should.eql(1024);
        done();
      })
      .catch(done);
  });

  it('should run any beforeRequest functions', (done) => {
    const inputWithBeforeMiddleware = createInput({
      beforeRequest: [
        (request) => {
          request.headers['X-Testing-True'] = 'Yes';
          return request;
        },
      ],
    }, {}, testLogger);
    const request = createAppRequestClient(inputWithBeforeMiddleware);
    request({url: 'http://zapier-httpbin.herokuapp.com/get'})
      .then(responseBefore => {
        const response = JSON.parse(JSON.stringify(responseBefore));

        response.request.headers['X-Testing-True'].should.eql('Yes');
        response.status.should.eql(200);

        const body = JSON.parse(response.content);
        body.url.should.eql('http://zapier-httpbin.herokuapp.com/get');
        done();
      })
      .catch(done);
  });

  it('should run any afterResponse functions', (done) => {
    const inputWithAfterMiddleware = createInput({
      afterResponse: [
        (response) => {
          response.json = {testing: true};
          return response;
        },
      ],
    }, {}, testLogger);
    const request = createAppRequestClient(inputWithAfterMiddleware);
    request({url: 'http://zapier-httpbin.herokuapp.com/get'})
      .then(responseBefore => {
        const response = JSON.parse(JSON.stringify(responseBefore));

        response.json.testing.should.eql(true);
        response.status.should.eql(200);

        const body = JSON.parse(response.content);
        body.url.should.eql('http://zapier-httpbin.herokuapp.com/get');
        done();
      })
      .catch(done);
  });

  it('should parse form type request body', (done) => {
    const request = createAppRequestClient(input);
    request({
      url: 'http://zapier-httpbin.herokuapp.com/post',
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: {
        name: 'Something Else',
        directions: '!!No Way José',
      },
    })
      .then(response => {
        response.status.should.eql(200);
        response.request.body.should.eql('name=Something+Else&directions=!!No+Way+Jos%C3%A9');
        const body = JSON.parse(response.content);
        body.form.name.should.eql('Something Else');
        body.form.directions.should.eql('!!No Way José');
        done();
      })
      .catch(done);
  });

  it('should not parse form type request body when string', (done) => {
    const request = createAppRequestClient(input);
    request({
      url: 'http://zapier-httpbin.herokuapp.com/post',
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: 'name=Something Else&directions=!!No Way José',
    })
      .then(response => {
        response.status.should.eql(200);
        response.request.body.should.eql('name=Something Else&directions=!!No Way José');
        const body = JSON.parse(response.content);
        body.form.name.should.eql('Something Else');
        body.form.directions.should.eql('!!No Way José');
        done();
      })
      .catch(done);
  });

});
