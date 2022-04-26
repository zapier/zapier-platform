'use strict';

const _ = require('lodash');
const memoize = require('./memoize');
const plainModule = require('./plain');

const isPlainObj = (o) => {
  return (
    o &&
    typeof o === 'object' &&
    (o.constructor === Object || o.constructor === plainModule.constructor)
  );
};

const comparison = (obj, needle) => obj === needle;

const getObjectType = (obj) => {
  if (_.isPlainObject(obj)) {
    return 'Object';
  }

  if (Array.isArray(obj)) {
    return 'Array';
  }

  return _.capitalize(typeof obj);
};

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
    if (
      Object.prototype.hasOwnProperty.call(obj, prop) && // https://eslint.org/docs/rules/no-prototype-builtins
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
    return obj.map((value) => {
      return recurseReplace(value, replacer, options);
    });
  } else if (isPlainObj(obj)) {
    const newObj = {};
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      newObj[key] = recurseReplace(value, replacer, options);
    });
    return newObj;
  } else {
    obj = replacer(obj);
  }
  return obj;
};

const _IGNORE = {};

// Flatten a nested object.
const flattenPaths = (data, { preserve = {} } = {}) => {
  const out = {};
  const recurse = (obj, prop = '') => {
    if (_.isPlainObject(obj)) {
      Object.entries(obj).forEach(([key, value]) => {
        const newProp = prop ? `${prop}.${key}` : key;

        if (preserve[prop]) {
          out[newProp] = value;
        }

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
  if (string == null) {
    return string;
  }
  if (!string || !string.toString) {
    return '';
  }

  const finalString = string.toString();

  if (finalString.length === 0) {
    return '';
  } else if (finalString.length > length) {
    const cutoff = suffix ? length - suffix.length : length;
    return finalString.substr(0, cutoff) + (suffix || '');
  }

  return string;
};

const truncateData = (item, maxLength) => {
  if (!item || typeof item !== 'object') {
    // the following code is only meant to work on objects and arrays
    return item;
  }
  if (JSON.stringify(item).length <= maxLength) {
    // no need to truncate
    return item;
  }
  const root = Array.isArray(item) ? [] : {};
  let length = 2; // '{}' or '[]'
  const queue = [];
  let itemToAdd; // used to hold the item to be written
  let wasTruncated = false; // used during iteration to track if a string was truncated
  const truncateMessageSize = Array.isArray(root) ? 38 : 39;

  if (maxLength < truncateMessageSize) {
    // ^ how much space it takes to add '"NOTE":"This data has been truncated.",' to the output
    throw new Error(`maxLength must be at least ${truncateMessageSize}`);
  }

  if (Array.isArray(item)) {
    item.forEach((value) => {
      queue.unshift([root, '', value]);
    });
  } else {
    Object.entries(item).forEach(([key, value]) => {
      queue.push([root, key, value]);
    });
  }

  // if the current parent is an array, we need to push values to said array;
  // if the current parent is an object, we need to set key / values on said object
  const _addItem = (parent, key, value) => {
    if (Array.isArray(parent)) {
      parent.push(value);
    } else {
      parent[key] = value;
    }
  };

  // iterate over the queue
  while (queue.length > 0) {
    let itemLength = 0;

    const [parent, key, value] = queue.shift();
    itemLength += key.length; // array keys are empty strings, so this is a noop
    itemLength += key.length ? 3 : 0; // objects get +2 for "" around the key and +1 for the :
    itemLength += 1; // arrays and objects both have +1 for commas between entries
    if (parent && typeof parent === 'object' && _.isEmpty(parent)) {
      itemLength -= 1; // this is the first entry for an object or array; remove the count for a comma
    }

    if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value == null
    ) {
      itemLength += String(value).length;
      itemToAdd = value;
    } else if (typeof value === 'string') {
      const overhead = length + itemLength + 2 + truncateMessageSize; // the minimum amount of space needed after truncation
      if (value.length + overhead > maxLength) {
        // this string is going to push us over the edge; truncate it
        const truncated = simpleTruncate(value, maxLength - overhead, ' [...]'); // maxLength - overhead = truncated.length
        itemLength += truncated.length + 2; // 2 for quotes
        itemToAdd = truncated;
      } else {
        // this string should fit!
        itemLength += value.length + 2; // 2 for quotes
        itemToAdd = value;
      }
    } else if (typeof value === 'object') {
      itemLength += 2; // '{}' or '[]'

      let entries;
      if (Array.isArray(value)) {
        const newArr = [];
        itemToAdd = newArr;
        entries = value.map((subValue) => [newArr, '', subValue]);
      } else {
        const newObj = {};
        itemToAdd = newObj;
        entries = Object.entries(value).map(([subKey, subValue]) => [
          newObj,
          subKey,
          subValue,
        ]);
      }
      queue.unshift(...entries);
    } else {
      // JSON.stringify doesn't _usually_ do anything for other typeofs
    }

    if (length + itemLength + truncateMessageSize >= maxLength) {
      // we can fit this item + the truncate message, so let's add it
      if (length + itemLength + truncateMessageSize === maxLength) {
        _addItem(parent, key, itemToAdd);
        length += itemLength;
      }
      wasTruncated = true;
      break;
    } else {
      // this fits with room to spare! add it and keep moving on. :)
      _addItem(parent, key, itemToAdd);
      length += itemLength;
    }
  }

  // we can hit the following even if we got through all the items in the queue in the case that any strings were truncated
  if (wasTruncated) {
    if (Array.isArray(root)) {
      root.push('NOTE: This data has been truncated.');
    } else {
      root.NOTE = 'This data has been truncated.';
    }
  }

  return root;
};

const genId = () => parseInt(Math.random() * 100000000);

module.exports = {
  deepCopy,
  deepFreeze,
  findMapDeep,
  flattenPaths,
  genId,
  getObjectType,
  isPlainObj,
  jsonCopy,
  memoizedFindMapDeep,
  recurseReplace,
  simpleTruncate,
  truncateData,
};
