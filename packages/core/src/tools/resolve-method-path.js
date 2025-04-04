'use strict';

const { isEqual } = require('lodash');
const { memoizedFindMapDeep } = require('./data');

const isRequestMethod = (needle) =>
  typeof needle === 'object' && typeof needle.url === 'string';

/**
  Verifies a object exists in an app tree, returning the path to it if found (optionally throwing an error if not found)
*/
const resolveMethodPath = (app, needle, explodeIfMissing = true) => {
  if (
    !(
      typeof needle === 'function' ||
      Array.isArray(needle) ||
      isRequestMethod(needle)
    )
  ) {
    throw new Error(
      `You must pass in a function/array/object. We got ${typeof needle} instead.`,
    );
  }

  // incurs roughly ~10ms penalty for _.isEqual fallback on a === miss on an averagish app
  const path =
    memoizedFindMapDeep(app, needle) ||
    memoizedFindMapDeep(app, needle, isEqual);
  if (!path && explodeIfMissing) {
    throw new Error(
      'We could not find your function/array/object anywhere on your App definition.',
    );
  }

  return path;
};

module.exports = resolveMethodPath;
