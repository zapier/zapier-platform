'use strict';

const _ = require('lodash');

const createStoreKeyTool = (input) => {
  const rpc = _.get(input, '_zapier.rpc');

  return {
    get: () => {
      if (!rpc) {
        return Promise.reject(new Error('rpc is not available'));
      }

      return rpc('get_cursor');
    },

    set: (cursor) => {
      if (!rpc) {
        return Promise.reject(new Error('rpc is not available'));
      }

      if (!_.isString(cursor)) {
        return Promise.reject(new TypeError('cursor value must be a string'));
      }

      return rpc('set_cursor', cursor);
    },
  };
};

module.exports = createStoreKeyTool;
