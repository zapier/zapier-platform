'use strict';

const should = require('should');
const request = require('../src/tools/request-client-internal');

describe('http requests', () => {
  it('should make GET requests', done => {
    request({ url: 'https://httpbin.org/get' })
      .then(response => {
        response.status.should.eql(200);
        should.exist(response.content);
        // httpbin capitalizes the response header name
        should.exist(response.content.headers['User-Agent']);
        response.content.headers['User-Agent']
          .includes('zapier-platform-core/')
          .should.be.true();
        response.content.headers['User-Agent']
          .includes('(via node-fetch)')
          .should.be.true();
        response.content.url.should.eql('https://httpbin.org/get');
        done();
      })
      .catch(done);
  });

  it('should make GET with url sugar param', done => {
    request('https://httpbin.org/get')
      .then(response => {
        response.status.should.eql(200);
        should.exist(response.content);
        response.content.url.should.eql('https://httpbin.org/get');
        done();
      })
      .catch(done);
  });

  it('should make GET with url sugar param and options', done => {
    const options = { headers: { A: 'B', 'user-agent': 'cool thing' } };
    request('https://httpbin.org/get', options)
      .then(response => {
        response.status.should.eql(200);
        should.exist(response.content);
        response.content.url.should.eql('https://httpbin.org/get');
        response.content.headers.A.should.eql('B');
        // don't clobber other internal user-agent headers if we decide to use them
        response.content.headers['User-Agent'].should.eql('cool thing');
        done();
      })
      .catch(done);
  });

  it('should make POST requests', done => {
    request({
      url: 'https://httpbin.org/post',
      method: 'POST',
      body: 'test'
    })
      .then(response => {
        response.status.should.eql(200);
        response.content.data.should.eql('test');
        done();
      })
      .catch(done);
  });
});
