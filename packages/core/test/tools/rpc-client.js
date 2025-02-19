'use strict';

const mocky = require('./mocky');
const should = require('should');

describe('rpc client', () => {
  const rpc = mocky.makeRpc();

  it('should handle a ping', () => {
    mocky.mockRpcCall('pong');

    return rpc('ping').then((result) => {
      result.should.eql('pong');
    });
  });

  it('should handle an explosion', () => {
    // mock 3 explosions due to retry
    mocky.mockRpcFail('this is an expected explosion', 500);
    mocky.mockRpcFail('this is an expected explosion', 500);
    mocky.mockRpcFail('this is an expected explosion', 500);

    return rpc('explode')
      .then(() => {
        throw new Error('this should have exploded');
      })
      .catch((err) => {
        err.message.should.eql(
          'RPC request failed after 3 attempts: Unable to reach the RPC server',
        );
      });
  });

  it('should fetch a definition_override', () => {
    const fakeDefinition = {
      platformVersion: '1.0.0',
      version: '1.0.0',
    };

    mocky.mockRpcCall(fakeDefinition);

    return rpc('get_definition_override').then((result) => {
      result.should.eql(fakeDefinition);
    });
  });

  it('should set a cursor key', (done) => {
    mocky.mockRpcCall(null);

    rpc('set_cursor', 'blah')
      .then((res) => {
        should(res).eql(null);
        done();
      })
      .catch(done);
  });

  it('should get a cursor key', (done) => {
    mocky.mockRpcCall('abc');

    rpc('get_cursor')
      .then((res) => {
        should(res).eql('abc');
        done();
      })
      .catch(done);
  });

  it('should get a missing cursor key', (done) => {
    mocky.mockRpcCall(null);

    rpc('get_cursor')
      .then((res) => {
        should(res).eql(null);
        done();
      })
      .catch(done);
  });
});
