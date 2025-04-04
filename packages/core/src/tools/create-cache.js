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
    scope = null,
    nx = null,
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
      scope !== null &&
      (!Array.isArray(scope) ||
        !scope.every((v) => v === 'user' || v === 'auth'))
    ) {
      throw new TypeError(
        'scope must be an array of strings with values "user" or "auth"',
      );
    }

    if (nx !== null && !_.isBoolean(nx)) {
      throw new TypeError('nx must be a boolean');
    }

    ensureJSONEncodable(value);
  };

  return {
    get: async (key, scope = null) => {
      runValidationChecks(rpc, key, scope);

      const result = await rpc('zcache_get', key, scope);
      return result ? JSON.parse(result) : null;
    },
    set: async (key, value, ttl = null, scope = null, nx = null) => {
      runValidationChecks(rpc, key, value, ttl, scope, nx);

      return await rpc(
        'zcache_set',
        key,
        JSON.stringify(value),
        ttl,
        scope,
        nx,
      );
    },
    delete: async (key, scope = null) => {
      runValidationChecks(rpc, key, scope);

      return await rpc('zcache_delete', key, scope);
    },
  };
};

module.exports = createCache;
