'use strict';

const _ = require('lodash');

const JSON = require('./create-json-tool')();

const createCacheObj = (input) => {
  const rpc = _.get(input, '_zapier.rpc');
  const runValidationChecks = (rpc, key, value = null, ttl = null) => {
    if (!rpc) {
      throw new Error('rpc is not available');
    }

    if (!_.isString(key)) {
      throw new Error('key must be a string');
    }

    if (!JSON.stringify(value)) {
      throw new Error('value must be JSON-encodable');
    }

    if (ttl != null && !_.isInteger(ttl)) {
      throw new Error('ttl must be a number');
    }
  };

  return {
    get: async (key) => {
      runValidationChecks(rpc, key);

      const result = await rpc('zcache_get', key);
      return JSON.parse(result);
    },
    set: async (key, value, ttl = null) => {
      runValidationChecks(rpc, key, value, ttl);

      const result = await rpc('zcache_set', key, JSON.stringify(value), ttl);
      return JSON.parse(result);
    },
    delete: async (key) => {
      runValidationChecks(rpc, key);

      const result = await rpc('zcache_delete', key);
      return JSON.parse(result);
    },
  };
};

module.exports = createCacheObj;