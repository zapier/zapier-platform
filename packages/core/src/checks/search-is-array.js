'use strict';

const _ = require('lodash');
const { simpleTruncate } = require('../tools/data');

const isSearch = require('./is-search');

const hasCanPaginate = (searchKey, compiledApp) => {
  const canPaginate = _.get(compiledApp, [
    'searches',
    searchKey,
    'operation',
    'canPaginate',
  ]);
  return canPaginate;
};

/*
  Searches should return an array of objects,
  or an object like { results: [...], paging_token: '...' } when canPaginate is true.
*/
const searchIsArrayOrObject = {
  name: 'searchIsArrayOrObject',
  shouldRun: isSearch,
  run: (method, results, compiledApp) => {
    console.log('searchIsArray', method, results, 'compiledApp', compiledApp);

    const searchKey = method.split('.', 2)[1];
    const truncatedResults = simpleTruncate(JSON.stringify(results), 50);

    if (hasCanPaginate(searchKey, compiledApp)) {
      // must be an object
      if (!_.isObject(results)) {
        return [
          `Paginating search results must be an object, got: ${typeof results}, (${truncatedResults})`,
        ];
      }
      // must have results and paging_token
      if (!_.has(results, 'results') || !_.has(results, 'paging_token')) {
        return [
          `Paginating search results must be an object containing results and paging_token, got: ${truncatedResults}`,
        ];
      }
      // make sure the secondary check can run
      results = results.results;
    }

    if (!_.isArray(results)) {
      return [
        `Search response results must be an array, got: ${typeof results}, (${truncatedResults})`,
      ];
    }
    return [];
  },
};

module.exports = searchIsArrayOrObject;
