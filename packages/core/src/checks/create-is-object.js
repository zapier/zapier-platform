'use strict';

const _ = require('lodash');
const { simpleTruncate } = require('../tools/data');

const isCreate = require('./is-create');

/*
  Makes sure the results are all objects.
*/
const createIsObject = {
  name: 'createIsObject',
  shouldRun: isCreate,
  run: (method, results) => {
    if (!_.isPlainObject(results)) {
      const repr = simpleTruncate(JSON.stringify(results), 50);
      return [
        `Got a non-object result, expected an object from create (${repr})`,
      ];
    }

    // assumes a single object not array is legit
    return [];
  },
};

module.exports = createIsObject;
