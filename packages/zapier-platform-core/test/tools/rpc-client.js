'use strict';

const mocky = require('./mocky');

describe('rpc client', () => {
  const rpc = mocky.makeRpc();

  it('should handle a ping', () => {
    mocky.mockRpcCall('pong');

    return rpc('ping').then(result => {
      result.should.eql('pong');
    });
  });

  it('should handle an explosion', () => {
    mocky.mockRpcFail('this is an expected explosion');

    return rpc('explode')
      .then(() => {
        throw new Error('this should have exploded');
      })
      .catch(err => {
        err.message.should.eql('this is an expected explosion');
      });
  });

  it('should fetch a definition_override', () => {
    const fakeDefinition = {
      platformVersion: '1.0.0',
      version: '1.0.0'
    };

    mocky.mockRpcCall(fakeDefinition);

    return rpc('get_definition_override').then(result => {
      result.should.eql(fakeDefinition);
    });
  });
});
