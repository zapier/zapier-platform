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
  or a response envelope like { results: [...], paging_token: '...' } 
  when canPaginate is true.
*/
const searchIsArrayOrEnvelope = {
  name: 'searchIsArrayOrEnvelope',
  shouldRun: isSearch,
  run: (method, results, compiledApp) => {
    const searchKey = method.split('.', 2)[1];
    const truncatedResults = simpleTruncate(JSON.stringify(results), 50);

    if (hasCanPaginate(searchKey, compiledApp)) {
      // if paging is supported and results is an object (indicating pagination), it must have results and paging_token
      if (_.isPlainObject(results)) {
        if (!_.has(results, 'results') || !_.has(results, 'paging_token')) {
          return [
            `Paginated search results must be an object containing results and paging_token, got: ${truncatedResults}`,
          ];
        }
        if (
          !_.isString(results.paging_token) &&
          !_.isNull(results.paging_token)
        ) {
          return [
            `"paging_token" must be a string or null, got: ${typeof results.paging_token}`,
          ];
        }
        // pass to array check below
        results = results.results;
      } else {
        return [
          `Paginated search results must be an object, got: ${typeof results}, (${truncatedResults})`,
        ];
      }
    }

    if (!_.isArray(results)) {
      return [
        `Search results must be an array, got: ${typeof results}, (${truncatedResults})`,
      ];
    }
    return [];
  },
};

module.exports = searchIsArrayOrEnvelope;
