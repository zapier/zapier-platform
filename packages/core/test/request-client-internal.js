'use strict';

const should = require('should');
const request = require('../src/tools/request-client-internal');

describe('http requests', () => {
  it('should make GET requests', done => {
    request({ url: 'https://httpbin.org/get' })
      .then(response => {
        response.status.should.eql(200);
        should.exist(response.content);
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
    const options = { headers: { A: 'B' } };
    request('https://httpbin.org/get', options)
      .then(response => {
        response.status.should.eql(200);
        should.exist(response.content);
        response.content.url.should.eql('https://httpbin.org/get');
        response.content.headers.A.should.eql('B');
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
