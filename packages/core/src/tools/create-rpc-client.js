'use strict';

const _ = require('lodash');

const constants = require('../constants');
const request = require('./request-client-internal');
const { genId } = require('./data');

const FALLBACK_RPC = process.env.ZAPIER_BASE_ENDPOINT + '/platform/rpc/cli';

const rpcCacheMock = (zcacheTestObj, method, key, value = null, ttl = null) => {
  if (method === 'zcache_get') {
    const result = key in zcacheTestObj ? zcacheTestObj[key] : 'null';
    return result;
  }

  if (method === 'zcache_set') {
    zcacheTestObj[key] = value;
    return JSON.stringify(true);
  }

  if (method === 'zcache_delete') {
    if (key in zcacheTestObj) {
      delete zcacheTestObj[key];
      return JSON.stringify(true);
    }

    return JSON.stringify(false);
  }

  throw new Error(`Unexpected method '${method}'`);
};

const createRpcClient = (event) => {
  return function (method) {
    const params = _.toArray(arguments);
    params.shift();

    const zcacheMethods = ['zcache_get', 'zcache_set', 'zcache_delete'];
    if (zcacheMethods.includes(method) && _.isPlainObject(event.zcacheTestObj)) {
      const [key, value = null] = params;
      return rpcCacheMock(event.zcacheTestObj, method, key, value);
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
            'to write tests that rely on the RPC API (i.e. z.stashFile)'
        );
      } else {
        throw new Error('No token found - cannot call RPC');
      }
    }

    return request(req)
      .then((res) => {
        if (res.content) {
          if (res.content.id !== id) {
            throw new Error(
              `Got id ${res.content.id} but expected ${id} when calling RPC`
            );
          }
          return res.content;
        } else {
          throw new Error(`Got a ${res.status} when calling RPC`);
        }
      })
      .then((content) => {
        if (content.error) {
          throw new Error(content.error);
        }
        return content.result;
      });
  };
};

module.exports = createRpcClient;
