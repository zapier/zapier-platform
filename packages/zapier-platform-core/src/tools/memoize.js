'use strict';

/* eslint-disable */

// Extracted from assets/app/common/memoize.js. Author @shauser.

var _slicedToArray = (function() {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;
    try {
      for (
        var _i = arr[Symbol.iterator](), _s;
        !(_n = (_s = _i.next()).done);
        _n = true
      ) {
        _arr.push(_s.value);
        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i['return']) _i['return']();
      } finally {
        if (_d) throw _e;
      }
    }
    return _arr;
  }
  return function(arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError(
        'Invalid attempt to destructure non-iterable instance'
      );
    }
  };
})();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

// Prevents `map` from becoming too large and taking up
// a huge amount of memory. Once `map.size` reaches `max`,
// `step` items are removed from `map`, with the oldest
// items being removed first.
var enforceSize = function enforceSize(max, step, map) {
  // If `map` isn't too big yet then we don't need to do anything.
  if (map.size < max) {
    return;
  }
  // Otherwise we need to trim it down to `targetSize`
  var targetSize = max - step;
  // ...in a `for` loop so we can bail once we have
  // trimmed it down enough.
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (
      var _iterator = map[Symbol.iterator](), _step;
      !(_iteratorNormalCompletion = (_step = _iterator.next()).done);
      _iteratorNormalCompletion = true
    ) {
      var _step$value = _slicedToArray(_step.value, 1),
        key = _step$value[0];

      // If we're still too big, slim down...
      if (map.size > targetSize) {
        map.delete(key);
      } else {
        // ...otherwise break early since we're slim enough.
        return;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
};

// Maps primitive keys to object values so that
// object values can be used in `WeakMap`.
var primitiveMap = new Map();

// Returns the object mapped to `primitive`.
var getObjectForPrimitive = function getObjectForPrimitive(primitive) {
  return primitiveMap.get(primitive);
};

// Creates an object for a `primitive` so that `primitive`
// can be "used" as a key within a `WeakMap`.
var setObjectForPrimitive = function setObjectForPrimitive(primitive) {
  primitiveMap.set(primitive, {});
  // Prevent `primitiveMap` from becoming massive and taking
  // up a huge chunk of memory.
  enforceSize(1000, 100, primitiveMap);
  return getObjectForPrimitive(primitive);
};

// Top level `WeakMap` that holds all of the cached values.
// The trunk/base of the `WeakMap` tree.
var weakCache = new WeakMap();

// Normalizes `arg` to an object if it isn't already an object
// since `WeakMap` keys must be objects. Does _not_ try to
// create an object for `arg` if it's a primitive; it only
// looks up existing objects.
var normalizeArg = function normalizeArg(arg) {
  return _lodash2.default.isObject(arg) ? arg : getObjectForPrimitive(arg);
};

// Trees are `WeakMap`s all the way down and the last
// one will have this special `valueKey` in it.
var valueKey = {};

// Looks up the memoized value in the `WeakMap` tree
// based on `args`, returning `undefined` if it's not found.
var getMemoizedValue = function getMemoizedValue(args) {
  var valueMap = args.reduce(function(map, arg) {
    // `map` should *always* be a `WeakMap` or `undefined` at this point.
    // It's `undefined` if the value hasn't been memoized yet.
    if (!(map && map.get)) {
      return undefined;
    }
    // Need to ensure `arg` is an object, however since this is
    // a lookup function we won't try to create an object for it
    // which would be useless.
    var argObject = normalizeArg(arg);
    // This should return a `WeakMap` if there's a cached value
    // for `argObject` or `undefined` if there isn't one.
    return map.get(argObject);
  }, weakCache);
  // If there is a cached value then `valueMap` will be a `WeakMap`.
  // If the value hasn't been cached then `valueMap` will be
  // `undefined`. We'll explicitly return `undefined` in the ternary.
  return valueMap ? valueMap.get(valueKey) : undefined;
};

// Creates a `WeakMap` tree that points from each item
// in the `args` array to `valueToMemoize`.
// Returns `valueToMemoize`.
var memoizeValue = function memoizeValue(args, valueToMemoize) {
  return (
    args
      .reduce(function(map, arg, idx) {
        // Get or create an object for `arg` depending
        // on if it's a primitive value because `WeakMap`
        // necessitates objects for keys.
        var argObject = normalizeArg(arg) || setObjectForPrimitive(arg);
        // If there's no key in `map` for `argObject` yet,
        // we need to add it.
        if (!map.has(argObject)) {
          var isLast = idx === args.length - 1;
          var newMap = new WeakMap();
          // If this is the last argument then we need to
          // associate the value in the `newMap`.
          if (isLast) {
            newMap.set(valueKey, valueToMemoize);
          }
          map.set(argObject, newMap);
        }
        // Should always return a `WeakMap`.
        return map.get(argObject);
        // Note that the `|| valueToMemoize` is a workaround for IE11.
        // Early versions of it won't `set` frozen objects as keys in
        // `WeakMap`s which results in the above `set` potentially failing
        // and therefore not returning the value.
      }, weakCache)
      .get(valueKey) || valueToMemoize
  );
};

// Returns a function whose arguments will create a `WeakMap`
// tree that should self-garbage collect. For example if there
// are arguments `a`, `b`, and `c`, `a` will point to a `WeakMap`
// with a key of `b`, which will point to a `WeakMap` with a key
// of `c`, which will point to the result of `fn`.
var memoize = function memoize(fn) {
  return function() {
    for (
      var _len = arguments.length, args = Array(_len), _key = 0;
      _key < _len;
      _key++
    ) {
      args[_key] = arguments[_key];
    }

    return (
      getMemoizedValue(args) || memoizeValue(args, fn.apply(undefined, args))
    );
  };
};

module.exports = memoize;
