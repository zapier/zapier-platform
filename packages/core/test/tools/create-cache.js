'use strict';

const should = require('should');

const { makeRpc, mockRpcCall } = require('./mocky');
const createCache = require('../../src/tools/create-cache');

describe('zcache: get, set, delete', () => {
  const rpc = makeRpc();
  const cache = createCache({ _zapier: { rpc } });

  it('zcache_get: should return the cache entry of an existing key', async () => {
    const value = {entity:'Zapier', colors: ['Orange', 'black']};
    mockRpcCall(JSON.stringify(value));

    const result = await cache.get('existing-key');
    should(result).eql(value);
  });

  it('zcache_get: should return null for a non-existing key', async () => {
    mockRpcCall(JSON.stringify(null));

    const result = await cache.get('non-existing-key');
    should(result).eql(null);
  });

  it('zcache_get: should throw error for non-string keys', async () => {
    await cache.get(12345).should.be.rejectedWith('key must be a string');
  });

  it('zcache_set: should set a cache entry when current throughput is within app\'s rate-limit', async () => {
    const key = 'random-key'
    const value = {entity:'Zapier', colors: ['Orange', 'black']};
    mockRpcCall(JSON.stringify(true));

    const result = await cache.set(key, value);
    should(result).eql(true);
  });

  it('zcache_set: should not set a cache entry when current throughput is outside app\'s rate-limit', async () => {
    const key = 'random-key'
    const value = {entity:'Zapier', colors: ['Orange', 'black']};
    mockRpcCall(JSON.stringify(false));

    const result = await cache.set(key, value);
    should(result).eql(false);
  });

  it('zcache_set: should throw error for values that are not JSON-encodable', async () => {
    const key = 'random-key';
    let value = console;
    await cache.set(key, value).should.be.rejectedWith("Type 'object' is not JSON-encodable (path: '')");

    value = () => { 'this is a function' };
    await cache.set(key, value).should.be.rejectedWith("Type 'function' is not JSON-encodable (path: '')");
  });

  it('zcache_set: should throw error for a non-integer ttl', async () => {
    await cache.set('random-key', 'random-value', 'twenty').should.be.rejectedWith('ttl must be an integer');
  });

  it('zcache_delete: should delete the cache entry of an existing key', async () => {
    mockRpcCall(JSON.stringify(true));

    const result = await cache.delete('existing-key');
    should(result).eql(true);
  });

  it('zcache_delete: should return false for a non-existing key', async () => {
    mockRpcCall(JSON.stringify(false));

    const result = await cache.delete('non-existing-key');
    should(result).eql(false);
  });
});
