'use strict';

const _ = require('lodash');

const isCreate = require('./is-create');

/*
  Makes sure the results are all objects.
*/
const createIsSingle = {
  name: 'createIsSingle',
  shouldRun: isCreate,
  run: (method, results) => {
    if (_.isArray(results)) {
      const repr = _.truncate(JSON.stringify(results), 50);
      return [
        `Got a result with multiple return values, expecting a single object from create (${repr})`
      ];
    }

    // assumes a single object not array is legit
    return [];
  }
};

module.exports = createIsSingle;
