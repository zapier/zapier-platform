'use strict';

const should = require('should');

const { makeRpc, mockRpcCall } = require('./mocky');
const createCache = require('../../src/tools/create-cache');

describe('zcache: get, set, delete', () => {
  const rpc = makeRpc();
  const cache = createCache({ _zapier: { rpc } });

  it('zcache_get: should return the cache entry of an existing key', async () => {
    const value = { entity: 'Zapier', colors: ['Orange', 'black'] };
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

  it("zcache_set: should set a cache entry based on the app's rate-limit", async () => {
    const key1 = 'random-key1';
    const key2 = 'random-key2';
    const value = { entity: 'Zapier', colors: ['Orange', 'black'] };
    const valueLength = JSON.stringify(value).length;

    // in bytes/minute
    const rateLimit = valueLength + 3;

    // still within the rate-limit
    should(valueLength).be.belowOrEqual(rateLimit);
    mockRpcCall(true);
    const result1 = await cache.set(key1, value);
    should(result1).eql(true);

    // outside the rate-limit in addition to the first request both within the same 1-minute time window
    should(valueLength * 2).be.above(rateLimit);
    mockRpcCall(false);
    const result2 = await cache.set(key2, value);
    should(result2).eql(false);
  });

  it('zcache_set: should throw error for values that are not JSON-encodable', async () => {
    const key = 'random-key';
    let value = console;
    await cache
      .set(key, value)
      .should.be.rejectedWith("Type 'object' is not JSON-encodable (path: '')");

    value = () => {
      'this is a function';
    };
    await cache
      .set(key, value)
      .should.be.rejectedWith(
        "Type 'function' is not JSON-encodable (path: '')",
      );
  });

  it('zcache_set: should throw error for a non-integer ttl', async () => {
    await cache
      .set('random-key', 'random-value', 'twenty')
      .should.be.rejectedWith('ttl must be an integer');
  });

  it('zcache_set: should throw error for a non-boolean nx', async () => {
    await cache
      .set('random-key', 'random-value', 1, [], 1)
      .should.be.rejectedWith('nx must be a boolean');
  });

  it('zcache_delete: should delete the cache entry of an existing key', async () => {
    mockRpcCall(true);

    const result = await cache.delete('existing-key');
    should(result).eql(true);
  });

  it('zcache_delete: should return false for a non-existing key', async () => {
    mockRpcCall(false);

    const result = await cache.delete('non-existing-key');
    should(result).eql(false);
  });

  it('zcache_set: no scope is ok', async () => {
    mockRpcCall(true);
    const res = await cache.set('key', 'ok');
    should(res).eql(true);
  });
  it('zcache_set: empty array scope is ok', async () => {
    mockRpcCall(true);

    const res = await cache.set('key', 'ok', 1, []);
    should(res).eql(true);
  });
  it('zcache_set: user and auth scope is ok', async () => {
    mockRpcCall(true);

    const res = await cache.set('key', 'ok', 1, ['user', 'auth']);
    should(res).eql(true);
  });
  it('zcache_set: scope as string is not ok', async () => {
    await cache
      .set('key', 'ok', 1, 'bad')
      .should.be.rejectedWith(
        'scope must be an array of strings with values "user" or "auth"',
      );
  });
  it('zcache_set: bad scope is not ok', async () => {
    await cache
      .set('key', 'ok', 1, ['bad', 'scope'])
      .should.be.rejectedWith(
        'scope must be an array of strings with values "user" or "auth"',
      );
  });
  it('zcache_set: mix of good and bad is not ok', async () => {
    await cache
      .set('key', 'ok', 1, ['bad', 'auth'])
      .should.be.rejectedWith(
        'scope must be an array of strings with values "user" or "auth"',
      );
  });
});
