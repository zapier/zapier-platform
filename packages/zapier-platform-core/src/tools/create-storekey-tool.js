'use strict';

const _ = require('lodash');
const ZapierPromise = require('./promise');

const createStoreKeyTool = input => {
  const rpc = _.get(input, '_zapier.rpc');

  return {
    get: () => {
      if (!rpc) {
        return ZapierPromise.reject(new Error('rpc is not available'));
      }

      return rpc('get_cursor');
    },
    set: cursor => {
      if (!rpc) {
        return ZapierPromise.reject(new Error('rpc is not available'));
      }

      return rpc('set_cursor', cursor);
    }
  };
};

module.exports = createStoreKeyTool;
