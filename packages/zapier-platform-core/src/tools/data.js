'use strict';

const _ = require('lodash');
const memoize = require('./memoize');

const isPlainObj = (o) => {
  return o && typeof o == 'object' && o.constructor === Object;
};

const comparison = (obj, needle) => obj === needle;

// Returns a path for the deeply nested haystack where
// you could find the needle. If the needle is a plain
// object we try _.isEqual (which could be slow!).
// TODO: might be nice to WeakMap memoize
const findMapDeep = (haystack, needle, comp) => {
  comp = comp || comparison;

  const finder = (obj, path) => {
    path = path || [];

    if (comp(obj, needle)) {
      return path;
    } else if (Array.isArray(obj)) {
      for (let i = obj.length - 1; i >= 0; i--) {
        const value = obj[i];
        const found = finder(value, path.concat([`[${i}]`]));
        if (found !== undefined) {
          return found;
        }
      }
    } else if (isPlainObj(obj)) {
      const keys = Object.keys(obj);
      for (let i = keys.length - 1; i >= 0; i--) {
        const key = keys[i];
        const value = obj[key];
        const found = finder(value, path.concat([`.${key}`]));
        if (found !== undefined) {
          return found;
        }
      }
    }

    return undefined;
  };

  const path = finder(haystack);
  if (path && path.length) {
    return _.trim(path.join(''), '.');
  } else {
    return undefined;
  }
};

const memoizedFindMapDeep = memoize(findMapDeep);

const deepCopy = (obj) => {
  return _.cloneDeepWith(obj, (value) => {
    if (_.isFunction(value)) {
      return value;
    }
    return undefined;
  });
};

const jsonCopy = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

const deepFreeze = (obj) => {
  Object.freeze(obj);

  Object.getOwnPropertyNames(obj).forEach(function (prop) {
    if (obj.hasOwnProperty(prop)
        && (typeof obj[prop] === 'object' || typeof obj[prop] === 'function')
        && obj[prop] !== null
        && !Object.isFrozen(obj[prop])) {
      deepFreeze(obj[prop]);
    }
  });

  return obj;
};

// Recurse a nested object replace stuff according to the function.
const recurseReplace = (obj, replacer) => {
  if (Array.isArray(obj)) {
    return obj.map((value) => {
      return recurseReplace(value, replacer);
    });
  } else if (isPlainObj(obj)) {
    const newObj = {};
    Object.keys(obj).map((key) => {
      const value = obj[key];
      newObj[key] = recurseReplace(value, replacer);
    });
    return newObj;
  } else {
    obj = replacer(obj);
  }
  return obj;
};

const _IGNORE = {};

// Flatten a nested object.
const flattenPaths = (data, sep) => {
  sep = sep || '.';
  const out = {};
  const recurse = (obj, prop) => {
    prop = prop || '';
    if (isPlainObj(obj)) {
      Object.keys(obj).map((key) => {
        const value = obj[key];
        const newProp = prop ? (prop + sep + key) : key;
        const subValue = recurse(value, newProp);
        if (subValue !== _IGNORE) {
          out[newProp] = subValue;
        }
      });
      return _IGNORE;
    } else {
      return obj;
    }
  };
  recurse(data);
  return out;
};

module.exports = {
  isPlainObj,
  findMapDeep,
  memoizedFindMapDeep,
  deepCopy,
  jsonCopy,
  deepFreeze,
  recurseReplace,
  flattenPaths
};
