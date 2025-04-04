const should = require('should');

const z = require('../zfactory')();
const { HTTPBIN_URL } = require('./constants');

describe('z', () => {
  it('z.hash', (done) => {
    const result = z.hash('sha256', 'my awesome string');
    result.should.equal(
      '97f13a1635524dd41daca6601e5d9fe07e10e62790851e527b039851b1f8b9a1',
    );
    done();
  });

  it('z.hmac', (done) => {
    const result = z.hmac('sha1', 'secret', 'signme');
    result.should.equal('f67a0be1fa49a3f1dbd659726d8983b838ee6e7d');
    done();
  });

  it('z.snipify', (done) => {
    const result = z.snipify('something');
    result.should.equal(':censored:9:720a531ca0:');
    done();
  });

  it('z.request - sync', () => {
    const bundleRequest = {
      method: 'GET',
      url: `${HTTPBIN_URL}/get`,
      params: {
        hello: 'world',
      },
      headers: {
        Accept: 'application/json',
      },
      auth: null,
      data: null,
    };

    const response = z.request(bundleRequest);
    response.should.have.property('status_code');
    response.should.have.property('headers');
    response.should.have.property('content');

    response.status_code.should.eql(200);
    const results = JSON.parse(response.content);
    results.args.should.deepEqual({ hello: ['world'] });
    results.headers.Accept.should.deepEqual(['application/json']);
  });

  it('z.request - async', (done) => {
    const bundleRequest = {
      method: 'POST',
      url: `${HTTPBIN_URL}/post`,
      params: {
        hello: 'world',
      },
      headers: {
        Accept: 'application/json',
      },
      auth: null,
      data: JSON.stringify({
        world: 'hello',
      }),
    };

    z.request(bundleRequest, (error, response) => {
      should(error).eql(null);
      response.should.have.property('status_code');
      response.should.have.property('headers');
      response.should.have.property('content');

      response.status_code.should.eql(200);
      const results = JSON.parse(response.content);
      results.args.should.eql({ hello: ['world'] });
      results.data.should.eql(bundleRequest.data);
      results.headers.Accept.should.deepEqual(['application/json']);

      done();
    });
  });

  it('z.JSON.parse', (done) => {
    const result = z.JSON.parse('{"hello": "world"}');
    result.should.have.property('hello');
    result.hello.should.eql('world');

    const invalidJsonString = '{invalid"hello": "world"}';

    try {
      z.JSON.parse(invalidJsonString);
    } catch (e) {
      e.name.should.eql('Error');
      e.message.should.eql(
        `Error parsing response. We got: "${invalidJsonString}"`,
      );
      done();
    }
  });

  it('z.JSON.stringify', (done) => {
    const result = z.JSON.stringify({
      hello: 'world',
    });
    result.should.equal('{"hello":"world"}');
    done();
  });

  it('z.AWS', (done) => {
    const AWS = z.AWS();
    AWS.config.getCredentials(done);
  });
});
