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

/**
 * Adds an item to an object or array.
 * If the parent is an object, the value will be set at the specified key.
 * If the parent is an array, the value will be added to the end of the array (and the key will be ignored).
 * Used by truncateData.
 *
 * @param {object | any[]} parent An object or array.
 * @param {string} key The key to set the value at (objects only; ignored for arrays).
 * @param {any} value The value to add.
 */
const _addItem = (parent, key, value) => {
  if (Array.isArray(parent)) {
    parent.push(value);
  } else {
    parent[key] = value;
  }
};

/**
 * Examines an object entry or array entry (`item`) and determines its "cost" (how many characters will it take to add it to `parent`).
 * If the item is a string, `availableSpace` is used to determine if the string should be truncated.
 * If the item is an object or array, its entries / values are added to `queue`.
 * Used by truncateData.
 *
 * @param {any[]} queue
 * @param {object | any[]} parent
 * @param {string} key
 * @param {any} item
 * @param {number} availableSpace
 * @returns
 */
const _processItem = (queue, parent, key, item, availableSpace) => {
  let itemLength = 0;
  let itemToAdd = item;
  let wasTruncated = false;

  itemLength += key.length; // array keys are empty strings, so this is a noop
  itemLength += key.length ? 3 : 0; // objects get +2 for "" around the key and +1 for the :
  itemLength += 1; // arrays and objects both have +1 for commas between entries
  if (parent && typeof parent === 'object' && _.isEmpty(parent)) {
    itemLength -= 1; // this is the first entry for an object or array; remove the count for a comma
  }

  if (typeof item === 'number' || typeof item === 'boolean' || item == null) {
    itemLength += String(item).length;
  } else if (typeof item === 'string') {
    const overhead = itemLength + 2; // the minimum amount of space needed after truncation
    if (item.length + overhead > availableSpace) {
      // this string is going to push us over the edge; truncate it
      itemToAdd = simpleTruncate(item, availableSpace - overhead, ' [...]');
      wasTruncated = true;
    }
    itemLength += itemToAdd.length + 2; // 2 for quotes around the string value
  } else if (typeof item === 'object') {
    itemLength += 2; // '{}' or '[]'

    let entries;
    if (Array.isArray(item)) {
      const newArr = [];
      itemToAdd = newArr;
      entries = item.map((subValue) => [newArr, '', subValue]);
    } else {
      const newObj = {};
      itemToAdd = newObj;
      entries = Object.entries(item).map(([subKey, subValue]) => [
        newObj,
        subKey,
        subValue,
      ]);
    }
    queue.unshift(...entries);
  } else {
    // JSON.stringify doesn't usually really do anything for any other typeofs
    // we're just going to use `undefined` and hope for the best
    itemLength += 'undefined'.length;
    itemToAdd = undefined;
  }
  return [itemLength, itemToAdd, wasTruncated];
};

/**
 * Takes a given `data` object or array and copies pieces of that data into `output` until its stringified length fits in `maxLength` characters.
 *
 * In general, output should track with `JSON.stringify(item).substring(0, maxLength)` (i.e. depth-first traversal of arrays and object entries), but in a JSON-aware way.
 * If the item's initial stringified length is less than or equal to `maxLength`, the item is returned as-is.
 * @param {object | any[]} data The JSON object or array to be truncated.
 * @param {number} maxLength The maximum length of JSON.stringify(output). Note that this may not be the exact output length, but it serves as an upper bound. Minimum value is 40.
 * @returns {object | any[]} The truncated object or array.
 */
const truncateData = (data, maxLength) => {
  if (!data || typeof data !== 'object') {
    // the following code is only meant to work on objects and arrays
    return data;
  }
  if (JSON.stringify(data).length <= maxLength) {
    // no need to truncate
    return data;
  }

  const root = Array.isArray(data) ? [] : {};
  let length = 2; // '{}' or '[]'
  let dataWasTruncated = false; // used during iteration to track if a string was truncated
  const truncateMessageSize = 39; // the overhead required to add a message about truncating data

  if (maxLength < 40) {
    // adding the truncate message takes 39 characters, but the minimum output (i.e. just the message wrapped in an object or array)
    // is 40 characters due to the overhead of the {} or [] characters (+2) minus the comma (-1)
    throw new Error(`maxLength must be at least 40`);
  }

  const queue = Array.isArray(data)
    ? data.map((value) => [root, '', value])
    : Object.entries(data).map(([key, value]) => [root, key, value]);

  // iterate over the queue
  while (queue.length > 0) {
    const [parent, key, item] = queue.shift();
    const [itemLength, processedItem, itemWasTruncated] = _processItem(
      queue,
      parent,
      key,
      item,
      maxLength - length - truncateMessageSize,
    );

    if (itemWasTruncated) {
      // if a string was truncated, we mark the total data as truncated for messaging purposes
      dataWasTruncated = true;
    }

    if (length + itemLength + truncateMessageSize < maxLength) {
      // we're still under the max length, add this and keep going
      _addItem(parent, key, processedItem);
      length += itemLength;
    } else {
      if (length + itemLength + truncateMessageSize === maxLength) {
        // we can fit this item + the truncate message, so let's add it before we stop
        _addItem(parent, key, processedItem);
      }
      dataWasTruncated = true;
      break;
    }
  }

  // we can hit the following even if we got through all the items in the queue in the case that any strings were truncated
  if (dataWasTruncated) {
    if (Array.isArray(root)) {
      root.push('NOTE : This data has been truncated.');
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
