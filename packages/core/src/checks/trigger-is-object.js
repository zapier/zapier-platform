'use strict';

const _ = require('lodash');
const { simpleTruncate } = require('../tools/data');

const isTrigger = require('./is-trigger');

/*
  Makes sure the results are all objects.
*/
const triggerIsObject = {
  name: 'triggerIsObject',
  shouldRun: isTrigger,
  run: (method, results) => {
    if (!_.isArray(results)) {
      return []; // trigger-is-array check will catch if not array
    }

    const nonObjectResult = _.find(results, (result) => {
      return !_.isPlainObject(result);
    });

    if (nonObjectResult !== undefined) {
      const repr = simpleTruncate(JSON.stringify(nonObjectResult), 50);
      return [
        `Got a non-object result in the array, expected only objects (${repr})`,
      ];
    }
    return [];
  },
};

module.exports = triggerIsObject;
