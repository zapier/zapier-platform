'use strict';

const _ = require('lodash');

const constants = require('../constants');
const request = require('./request-client-internal');
const { genId } = require('./data');

const FALLBACK_RPC = process.env.ZAPIER_BASE_ENDPOINT + '/platform/rpc/cli';

const rpcCacheMock = (zcacheTestObj, method, key, value = null, ttl = null) => {
  if (method === 'zcache_get') {
    const result = key in zcacheTestObj ? zcacheTestObj[key] : null;
    return result;
  }

  if (method === 'zcache_set') {
    zcacheTestObj[key] = value;
    return true;
  }

  if (method === 'zcache_delete') {
    if (key in zcacheTestObj) {
      delete zcacheTestObj[key];
      return true;
    }

    return false;
  }

  throw new Error(`Unexpected method '${method}'`);
};

const rpcCursorMock = (cursorTestObj, method, key, value = null) => {
  if (method === 'get_cursor') {
    return cursorTestObj[key] || null;
  }

  if (method === 'set_cursor') {
    cursorTestObj[key] = value;
    return null;
  }

  throw new Error(`Unexpected method '${method}'`);
};

const createRpcClient = (event) => {
  return async function (method) {
    const params = _.toArray(arguments);
    params.shift();

    const zcacheMethods = ['zcache_get', 'zcache_set', 'zcache_delete'];
    if (
      zcacheMethods.includes(method) &&
      _.isPlainObject(event.zcacheTestObj)
    ) {
      const [key, value = null] = params;
      return rpcCacheMock(event.zcacheTestObj, method, key, value);
    }

    const cursorMethods = ['get_cursor', 'set_cursor'];
    if (
      cursorMethods.includes(method) &&
      _.isPlainObject(event.cursorTestObj)
    ) {
      const [key, value = null] = params;
      return rpcCursorMock(event.cursorTestObj, method, key, value);
    }

    const id = genId();
    const body = JSON.stringify({
      id,
      storeKey: event.storeKey,
      method,
      params,
    });

    const req = {
      method: 'POST',
      url: `${event.rpc_base || FALLBACK_RPC}`,
      body,
      headers: {},
    };

    if (event.token) {
      req.headers['X-Token'] = event.token;
    } else if (process.env.ZAPIER_DEPLOY_KEY) {
      req.headers['X-Deploy-Key'] = process.env.ZAPIER_DEPLOY_KEY;
    } else {
      if (constants.IS_TESTING) {
        throw new Error(
          'No deploy key found. Make sure you set the `ZAPIER_DEPLOY_KEY` environment variable ' +
            'to write tests that rely on the RPC API (i.e. z.stashFile)',
        );
      } else {
        throw new Error('No token found - cannot call RPC');
      }
    }

    // RPC can fail, so let's retry.
    // Be careful what we throw here as this will be forwarded to the user.
    const maxRetries = 3;
    let attempt = 0;
    let res;

    while (attempt < maxRetries) {
      // We will throw here, which will be caught by catch logic to either retry or bubble up.
      try {
        res = await request(req);

        if (res.status > 500) {
          throw new Error('Unable to reach the RPC server');
        }
        if (res.content) {
          // check if the ids match
          if (res.content.id !== id) {
            throw new Error(
              `Got id ${res.content.id} but expected ${id} when calling RPC`,
            );
          }
          if (res.content.error) {
            throw new Error(res.content.error);
          }
          return res.content.result;
        } else {
          throw new Error(`Got a ${res.status} when calling RPC`);
        }
      } catch (err) {
        attempt++;

        if (attempt === maxRetries || (res && res.status < 500)) {
          throw new Error(
            `RPC request failed after ${attempt} attempts: ${err.message}`,
          );
        }
        // sleep for 100ms before retrying
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  };
};

module.exports = createRpcClient;
