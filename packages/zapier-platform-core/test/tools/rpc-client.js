'use strict';

const should = require('should');

const mocky = require('./mocky');

describe('rpc client', () => {
  const rpc = mocky.makeRpc();

  it('should handle a ping', (done) => {
    mocky.mockRpcCall('pong');

    rpc('ping')
      .then(result => {
        should(result).eql('pong');
      })
      .then(() => done())
      .catch(done);
  });

  it('should handle an explosion', (done) => {
    mocky.mockRpcFail('this is an expected explosion');

    rpc('explode')
      .then(() => done(new Error('this should have exploded')))
      .catch(err => {
        should(err.message).eql('this is an expected explosion');
        done();
      })
      .catch(done);
  });
});
