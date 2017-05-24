'use strict';

const _ = require('lodash');

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
      const repr = _.truncate(JSON.stringify(nonObjectResult), 50);
      return [
        `Got a result missing that was not an object (${repr})`
      ];
    }
    return [];
  }
};

module.exports = triggerIsObject;
