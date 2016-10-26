'use strict';

const _ = require('lodash');

const isTrigger = require('./is-trigger');

/*
  Makes sure the results all have an ID in them.
*/
const triggerHasId = {
  name: 'triggerHasId',
  shouldRun: isTrigger,
  run: (method, results) => {
    const missingIdResult = _.find(results, (result) => {
      return _.isUndefined(result.id) || _.isNull(result.id);
    });

    if (missingIdResult) {
      const repr = _.truncate(JSON.stringify(missingIdResult), 250);
      return [
        `Got a result missing the "id" property (${repr})`
      ];
    }
    return [];
  }
};

module.exports = triggerHasId;
