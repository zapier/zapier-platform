'use strict';

const should = require('should');

const request = require('../src/tools/request-client-internal');
const { HTTPBIN_URL } = require('./constants');

describe('http requests', () => {
  it('should make GET requests', async () => {
    const response = await request({
      url: `${HTTPBIN_URL}/get`,
    });
    response.status.should.eql(200);
    should.exist(response.content);
    // httpbin capitalizes the response header name
    should.exist(response.content.headers['User-Agent']);
    response.content.headers['User-Agent'][0]
      .includes('zapier-platform-core/')
      .should.be.true();
    response.content.url.should.endWith('/get');
  });

  it('should make GET with url sugar param', async () => {
    const response = await request(`${HTTPBIN_URL}/get`);
    response.status.should.eql(200);
    should.exist(response.content);
    response.content.method.should.eql('GET');
    response.content.url.should.endWith('/get');
  });

  it('should make GET with url sugar param and options', async () => {
    const options = { headers: { A: 'B', 'user-agent': 'cool thing' } };
    const response = await request(`${HTTPBIN_URL}/get`, options);
    response.status.should.eql(200);
    should.exist(response.content);
    response.content.method.should.eql('GET');
    response.content.url.should.endWith('/get');
    response.content.headers.A.should.deepEqual(['B']);
    // don't clobber other internal user-agent headers if we decide to use them
    response.content.headers['User-Agent'].should.deepEqual(['cool thing']);
  });

  it('should make POST requests', (done) => {
    request({
      url: `${HTTPBIN_URL}/post`,
      method: 'POST',
      body: 'test',
    })
      .then((response) => {
        response.status.should.eql(200);
        response.content.data.should.eql('test');
        done();
      })
      .catch(done);
  });
});
