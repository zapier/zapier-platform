'use strict';

const should = require('should');
const { makeRpc, mockRpcCall } = require('./mocky');
const createCache = require('../../src/tools/create-cache');
const createLock = require('../../src/tools/create-lock');
const { ThrottledError } = require('../../src/errors');
const timekeeper = require('timekeeper');

describe('lock', () => {
  const rpc = makeRpc();
  const input = { _zapier: { rpc } };
  const cache = createCache(input);
  const lock = createLock(input, cache);

  afterEach(() => {
    timekeeper.reset();
  });

  it('should acquire lock successfully', async () => {
    // Acquire the lock
    mockRpcCall(true);
    // Release the lock
    mockRpcCall(true);

    const expensiveCall = async () =>
      new Promise((resolve) => {
        resolve('success');
      });

    const result = await lock(['test'], expensiveCall, 10);
    should(result).eql('success');
  });

  it('should throw ThrottledError if trying to acquire a held lock', async () => {
    const someTimeAgo = new Date('2020-01-01T00:00:00Z'); // Using ISO format
    timekeeper.freeze(someTimeAgo);
    const expiry = someTimeAgo.getTime() + 30 * 10000; // set to 30 seconds from 'someTimeAgo'

    const now = new Date(someTimeAgo.getTime() + 10 * 10000); // 10 seconds from 'someTimeAgo'
    const expectedDelay = (expiry - now.getTime()) / 10000; // 20 seconds
    timekeeper.freeze(now);

    const expensiveCall = async () =>
      new Promise((resolve) => resolve('success'));

    try {
      mockRpcCall(String(expiry));
      await lock(['test'], expensiveCall, 30);
    } catch (err) {
      should(err).instanceOf(ThrottledError);
      err.name.should.eql('ThrottledError');

      const response = JSON.parse(err.message);
      response.delay.should.eql(expectedDelay);
    }
  });

  it('should throw TypeError if input fields are not valid', async () => {
    // Invalid key array
    await lock('test', () => {}, 10).should.be.rejectedWith(TypeError);
    // Invalid callbackFn
    await lock(['test'], '12', 10).should.be.rejectedWith(TypeError);
    // Invalid maxLockSec
    await lock('test', () => {}, -3).should.be.rejectedWith(TypeError);
    // Invalid scope
    await lock('test', () => {}, 30, 'fake-scope').should.be.rejectedWith(
      TypeError
    );
  });

  it('should default to using the user namespace scope', async () => {
    const setNamespace = {
      mode: '',
      scope: '',
    };
    const deleteNamespace = {
      mode: '',
      scope: '',
    };
    const cache = {
      set: (key, value, maxLockSec, namespaceMode, namespaceScope) => {
        setNamespace.mode = namespaceMode;
        setNamespace.scope = namespaceScope;
        return true;
      },
      delete: (key, namespaceMode, namespaceScope) => {
        deleteNamespace.mode = namespaceMode;
        deleteNamespace.scope = namespaceScope;
        return true;
      },
    };
    const lock = createLock(input, cache);
    const expensiveCall = async () => {
      return 'success';
    };
    await lock(['test'], expensiveCall, 10);
    setNamespace.mode.should.eql('locking');
    setNamespace.scope.should.eql('user');
    deleteNamespace.mode.should.eql('locking');
    deleteNamespace.scope.should.eql('user');
  });

  it('should use the same namespace parameters to lock and unlock', async () => {
    const setNamespace = {
      mode: '',
      scope: '',
    };
    const deleteNamespace = {
      mode: '',
      scope: '',
    };
    const cache = {
      set: (key, value, maxLockSec, namespaceMode, namespaceScope) => {
        setNamespace.mode = namespaceMode;
        setNamespace.scope = namespaceScope;
        return true;
      },
      delete: (key, namespaceMode, namespaceScope) => {
        deleteNamespace.mode = namespaceMode;
        deleteNamespace.scope = namespaceScope;
        return true;
      },
    };
    const lock = createLock(input, cache);
    const expensiveCall = async () => {
      return 'success';
    };
    await lock(['test'], expensiveCall, 10, 'global');
    setNamespace.mode.should.eql('locking');
    setNamespace.scope.should.eql('global');
    deleteNamespace.mode.should.eql('locking');
    deleteNamespace.scope.should.eql('global');
  });
});
