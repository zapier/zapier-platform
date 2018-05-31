'use strict';

const _ = require('lodash');
const memoize = require('./memoize');
const plainModule = require('./plain');

const isPlainObj = o => {
  return (
    o &&
    typeof o == 'object' &&
    (o.constructor === Object || o.constructor === plainModule.constructor)
  );
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

const deepCopy = obj => {
  return _.cloneDeepWith(obj, value => {
    if (_.isFunction(value)) {
      return value;
    }
    return undefined;
  });
};

const jsonCopy = obj => {
  return JSON.parse(JSON.stringify(obj));
};

const deepFreeze = obj => {
  Object.freeze(obj);

  Object.getOwnPropertyNames(obj).forEach(function(prop) {
    if (
      obj.hasOwnProperty(prop) &&
      (typeof obj[prop] === 'object' || typeof obj[prop] === 'function') &&
      obj[prop] !== null &&
      !Object.isFrozen(obj[prop])
    ) {
      deepFreeze(obj[prop]);
    }
  });

  return obj;
};

// Recurse a nested object replace stuff according to the function.
const recurseReplace = (obj, replacer, options = {}) => {
  if (options.all) {
    obj = replacer(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(value => {
      return recurseReplace(value, replacer, options);
    });
  } else if (isPlainObj(obj)) {
    const newObj = {};
    Object.keys(obj).map(key => {
      const value = obj[key];
      newObj[key] = recurseReplace(value, replacer, options);
    });
    return newObj;
  } else {
    obj = replacer(obj);
  }
  return obj;
};

// Recursively extract values from a nested object based on the matcher function.
const recurseExtract = (obj, matcher) => {
  const values = [];
  Object.keys(obj).map(key => {
    const value = obj[key];
    if (matcher(key, value)) {
      values.push(value);
    } else if (isPlainObj(value)) {
      recurseExtract(value, matcher).map(v => {
        values.push(v);
      });
    }
  });
  return values;
};

const _IGNORE = {};

// Flatten a nested object.
const flattenPaths = (data, sep) => {
  sep = sep || '.';
  const out = {};
  const recurse = (obj, prop) => {
    prop = prop || '';
    if (isPlainObj(obj)) {
      Object.keys(obj).map(key => {
        const value = obj[key];
        const newProp = prop ? prop + sep + key : key;
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

// A simpler, and memory-friendlier version of _.truncate()
const simpleTruncate = (string, length, suffix) => {
  if (!string || !string.toString) {
    return '';
  }

  const finalString = string.toString();

  if (finalString.length === 0) {
    return '';
  } else if (finalString.length > length) {
    const cutoff = suffix ? length - suffix.length : length;
    return finalString.substr(0, cutoff) + (suffix ? suffix : '');
  }

  return string;
};

const genId = () => parseInt(Math.random() * 100000000);

module.exports = {
  isPlainObj,
  findMapDeep,
  memoizedFindMapDeep,
  deepCopy,
  jsonCopy,
  deepFreeze,
  recurseReplace,
  recurseExtract,
  flattenPaths,
  simpleTruncate,
  genId
};
