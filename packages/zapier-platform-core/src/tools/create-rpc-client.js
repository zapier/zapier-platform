'use strict';

const _ = require('lodash');

const request = require('./request-client-internal');

const FALLBACK_RPC = 'http://localhost:8000/platform/rpc/cli';

const createRpcClient = (event) => {
  return function(method) {
    const params = _.toArray(arguments);
    params.shift();

    const id = parseInt(Math.random() * 100000000);
    const body = JSON.stringify({
      id: id,
      method,
      params
    });

    // if (event.rpc_base) {
    //   throw new Error('No `event.rpc_base` provided - cannot call RPC');
    // }

    const req = {
      method: 'POST',
      url: `${event.rpc_base || FALLBACK_RPC}`,
      body: body,
      headers: {}
    };

    if (event.token) {
      req.headers['X-Token'] = event.token;
    } else if (process.env.ZAPIER_DEPLOY_KEY) {
      req.headers['X-Deploy-Key'] = process.env.ZAPIER_DEPLOY_KEY;
    } else {
      throw new Error('No token or deploy key found - cannot call RPC');
    }

    return request(req)
      .then(res => {
        if (res.content) {
          if (res.content.id !== id) {
            throw new Error(`Got id ${res.content.id} but expected ${id} when calling RPC`);
          }
          return res.content;
        } else {
          throw new Error(`Got a ${res.status} when calling RPC`);
        }
      })
      .then(content => {
        if (content.error) {
          throw new Error(content.error);
        }
        return content.result;
      });
  };
};

module.exports = createRpcClient;
