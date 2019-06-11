'use strict';

const _ = require('lodash');
const { simpleTruncate } = require('../tools/data');

const isSearch = require('./is-search');

/*
  Searches should always return an array of objects.
*/
const searchIsArray = {
  name: 'triggerIsArray',
  shouldRun: isSearch,
  run: (method, results) => {
    if (!_.isArray(results)) {
      const repr = simpleTruncate(JSON.stringify(results), 50);
      return [`Results must be an array, got: ${typeof results}, (${repr})`];
    }
    return [];
  }
};

module.exports = searchIsArray;
