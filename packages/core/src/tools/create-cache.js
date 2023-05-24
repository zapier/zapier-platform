'use strict';

const _ = require('lodash');

const JSON = require('./create-json-tool')();
const ensureJSONEncodable = require('./ensure-json-encodable');

const createCache = (input) => {
  const rpc = _.get(input, '_zapier.rpc');
  const runValidationChecks = (rpc, key, value = null, ttl = null) => {
    if (!rpc) {
      throw new Error('rpc is not available');
    }

    if (!_.isString(key)) {
      throw new TypeError('key must be a string');
    }

    if (ttl != null && !_.isInteger(ttl)) {
      throw new TypeError('ttl must be an integer');
    }

    ensureJSONEncodable(value);
  };

  return {
    get: async (key) => {
      runValidationChecks(rpc, key);

      const result = await rpc('zcache_get', key);
      return JSON.parse(result);
    },
    set: async (key, value, ttl = null) => {
      runValidationChecks(rpc, key, value, ttl);

      return await rpc('zcache_set', key, JSON.stringify(value), ttl);
    },
    delete: async (key) => {
      runValidationChecks(rpc, key);

      return await rpc('zcache_delete', key);
    },
  };
};

module.exports = createCache;
