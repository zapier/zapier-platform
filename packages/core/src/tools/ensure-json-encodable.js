'use strict';

const _ = require('lodash');

const ensureJSONEncodable = (obj, path = null, visited = null) => {
  if (obj === null || _.isBoolean(obj) || _.isNumber(obj) || _.isString(obj)) {
    return;
  }

  path = path || [];

  if (!_.isPlainObject(obj) && !_.isArray(obj)) {
    const typeName = typeof obj;
    const pathStr = path.join('.');
    throw new TypeError(
      `Type '${typeName}' is not JSON-encodable (path: '${pathStr}')`,
    );
  }

  visited = visited || new Set();

  if (visited.has(obj)) {
    const pathStr = path.join('.');
    throw new TypeError(
      `Circular structure is not JSON-encodable (path: '${pathStr}')`,
    );
  }

  visited.add(obj);

  for (const key in obj) {
    ensureJSONEncodable(obj[key], path.concat(key), visited);
  }
};

module.exports = ensureJSONEncodable;
