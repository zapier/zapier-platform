'use strict';

const _ = require('lodash');

const ensureArray = (maybeArray) => {
  if (_.isArray(maybeArray)) {
    return maybeArray;
  }
  if (_.isNil(maybeArray)) {
    return [];
  }
  return [maybeArray];
};

module.exports = ensureArray;
