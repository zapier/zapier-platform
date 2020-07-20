'use strict';

const _ = require('lodash');

const constants = require('../constants');
const request = require('./request-client-internal');
const { genId } = require('./data');

const FALLBACK_RPC = process.env.ZAPIER_BASE_ENDPOINT + '/platform/rpc/cli';

const createRpcClient = (event) => {
  return function (method) {
    const params = _.toArray(arguments);
    params.shift();

    const id = genId();
    const body = JSON.stringify({
      id: id,
      storeKey: event.storeKey,
      method,
      params,
    });

    const req = {
      method: 'POST',
      url: `${event.rpc_base || FALLBACK_RPC}`,
      body: body,
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
