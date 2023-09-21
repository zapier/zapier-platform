'use strict';

const should = require('should');

const { makeRpc, mockRpcCall } = require('./mocky');
const createStoreKeyTool = require('../../src/tools/create-storekey-tool');

describe('storekey (cursor): get, set', () => {
  const rpc = makeRpc();
  const cursor = createStoreKeyTool({ _zapier: { rpc } });

  it('storekey (cursor) get: should return the cursor value given a key', async () => {
    const expected = 64;
    mockRpcCall(expected);

    const result = await cursor.get('existing-key');
    should(result).eql(expected);
  });

  it('storekey (cursor) set: should raise TypeError on non-string value', async () => {
    await should(cursor.set(64)).rejectedWith(TypeError, {
      message: 'cursor value must be a string',
    });

    await should(cursor.set(null)).rejectedWith(TypeError, {
      message: 'cursor value must be a string',
    });

    await should(cursor.set(undefined)).rejectedWith(TypeError, {
      message: 'cursor value must be a string',
    });
  });

  it('storekey (cursor) set: should set a cursor entry', async () => {
    const expected = 'ok';
    mockRpcCall(expected);

    const result1 = await cursor.set('test-key');
    should(result1).eql(expected);
  });
});
