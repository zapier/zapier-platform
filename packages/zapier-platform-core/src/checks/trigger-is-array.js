'use strict';

const _ = require('lodash');

const isTrigger = require('./is-trigger');

/*
  Triggers should always return an array of objects.
*/
const triggerIsArray = {
  name: 'triggerIsArray',
  shouldRun: isTrigger,
  run: (method, results) => {
    if (!_.isArray(results)) {
      const repr = _.truncate(JSON.stringify(results), 50);
      return [
        `Results must be an array, got: ${typeof results}, (${repr})`
      ];
    }
    return [];
  }
};

module.exports = triggerIsArray;
