'use strict';

const _ = require('lodash');
const { simpleTruncate } = require('../tools/data');

const isSearch = require('./is-search');

const hasCanPaginate = (searchKey, compiledApp) => {
  const canPaginate =
    compiledApp?.searches?.[searchKey]?.operation?.canPaginate;
  return canPaginate;
};

/*
  Searches should return an array of objects,
  or an object like { results: [...], paging_token: '...' } when canPaginate is true.
*/
const searchIsArray = {
  name: 'searchIsArrayOrObject',
  shouldRun: isSearch,
  run: (method, results, compiledApp) => {
    const searchKey = method.split('.', 2)[1];
    const truncatedResults = simpleTruncate(JSON.stringify(results), 50);

    if (hasCanPaginate(searchKey, compiledApp)) {
      // if paging is supported and results is an object (indicating pagination), it must have results and paging_token
      if (_.isPlainObject(results)) {
        if (!_.has(results, 'results') || !_.has(results, 'paging_token')) {
          return [
            `Paging search results must be an object containing results and paging_token, got: ${truncatedResults}`,
          ];
        }
        // ensure the secondary check can run
        results = results.results;
      }
      return [];
    }

    if (!_.isArray(results)) {
      return [
        `Search response results must be an array, got: ${typeof results}, (${truncatedResults})`,
      ];
    }
    return [];
  },
};

module.exports = searchIsArray;
