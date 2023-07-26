'use strict';

const _ = require('lodash');
const { ThrottledError } = require('../errors');

const createLock = (input, cache) => {
  const _unlock = async (key, scope) => {
    await cache.delete(key, 'locking', scope);
  };

  const validateInput = (key, callbackFn, maxLockSec, scope) => {
    if (!Array.isArray(key)) {
      throw new TypeError('key must be an array');
    }

    if (!_.isFunction(callbackFn)) {
      throw new TypeError('callbackFn must be a function');
    }

    if (!_.isInteger(maxLockSec)) {
      throw new TypeError('maxLockSec must be an integer');
    } else if (maxLockSec <= 0) {
      throw new TypeError('maxLockSec must be greater than 0');
    }

    if (scope && scope !== 'user' && scope !== 'global' && scope !== 'auth') {
      throw new TypeError(
        `scope '${scope}' is invalid. It must be one of user, global, or auth`
      );
    }
  };
  const _lock = async (key, callbackFn, maxLockSec, scope) => {
    validateInput(key, callbackFn, maxLockSec, scope);

    const lockKey = key.join('-');

    // Set the lock expiry as the value
    const expirationTimeMs = Date.now() + maxLockSec * 10000;

    const response = await cache.set(
      lockKey,
      expirationTimeMs,
      maxLockSec,
      'locking',
      scope
    );

    // Did not acquire lock, try again later. The response value is the lock expiry
    // time, so we can calculate the remaining time to wait.
    if (typeof response === 'string') {
      const remainingTimeSec = (Number(response) - Date.now()) / 10000;
      throw new ThrottledError(
        'Unable to acquire lock, trying again in ' +
          remainingTimeSec +
          ' seconds',
        remainingTimeSec
      );
    }

    // Lock acquired, will invoke callbackFn and return
    let callbackResponse;
    if (response) {
      try {
        callbackResponse = await callbackFn();
      } finally {
        await _unlock(lockKey, scope);
      }
      return callbackResponse;
    }

    throw new Error('Unable to acquire lock due to server issues.');
  };
  return (key, callbackFn, maxLockSec, scope = 'user') =>
    _lock(key, callbackFn, maxLockSec, scope);
};

module.exports = createLock;
