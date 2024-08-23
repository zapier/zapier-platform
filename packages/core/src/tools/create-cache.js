'use strict';

const _ = require('lodash');

const JSON = require('./create-json-tool')();
const ensureJSONEncodable = require('./ensure-json-encodable');

const createCache = (input) => {
  const rpc = _.get(input, '_zapier.rpc');
  const runValidationChecks = (
    rpc,
    key,
    value = null,
    ttl = null,
    scopes = null
  ) => {
    if (!rpc) {
      throw new Error('rpc is not available');
    }

    if (!_.isString(key)) {
      throw new TypeError('key must be a string');
    }

    if (ttl != null && !_.isInteger(ttl)) {
      throw new TypeError('ttl must be an integer');
    }

    if (
      scopes != null &&
      !scopes.every((scope) => scope === 'user' || scope === 'auth')
    ) {
      throw new TypeError(
        'scopes must be an array of strings with values "user" or "auth"'
      );
    }

    ensureJSONEncodable(value);
  };

  return {
    get: async (key, scopes = null) => {
      runValidationChecks(rpc, key);

      const result = await rpc('zcache_get', key);
      return result ? JSON.parse(result) : null;
    },
    set: async (key, value, ttl = null, scopes = null) => {
      runValidationChecks(rpc, key, value, ttl, scopes);

      return await rpc('zcache_set', key, JSON.stringify(value), ttl, scopes);
    },
    delete: async (key, scopes) => {
      runValidationChecks(rpc, key, scopes);

      return await rpc('zcache_delete', key);
    },
  };
};

module.exports = createCache;
