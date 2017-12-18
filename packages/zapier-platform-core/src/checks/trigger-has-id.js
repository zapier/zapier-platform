'use strict';

const _ = require('lodash');
const { simpleTruncate } = require('../tools/data');

const isTrigger = require('./is-trigger');

/*
  Makes sure the results all have an ID in them.
*/
const triggerHasId = {
  name: 'triggerHasId',
  shouldRun: (method, bundle) => {
    // Hooks will have a bundle.cleanedRequest and we don't need to check they've got an id
    return isTrigger(method) && !bundle.cleanedRequest;
  },
  run: (method, results) => {
    const missingIdResult = _.find(results, result => {
      return !result || _.isUndefined(result.id) || _.isNull(result.id);
    });

    if (missingIdResult) {
      const repr = simpleTruncate(JSON.stringify(missingIdResult), 250);
      return [`Got a result missing the "id" property (${repr})`];
    }
    return [];
  }
};

module.exports = triggerHasId;
