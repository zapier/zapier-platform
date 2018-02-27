'use strict';

const _ = require('lodash');

const isTrigger = require('./is-trigger');

/*
  Makes sure the results all have a unique ID in them.
*/
const triggerHasUniqueIds = {
  name: 'triggerHasUniqueIds',
  shouldRun: isTrigger,
  run: (method, results) => {
    const idCount = {};
    let doubleId;
    _.forEach(results, result => {
      const count = (idCount[result.id] = (idCount[result.id] || 0) + 1);
      if (count > 1) {
        doubleId = result.id;
        return false; // stop iteration
      }
      return true;
    });

    if (doubleId !== undefined) {
      return [`Got a two or more results with the id of "${doubleId}"`];
    }
    return [];
  }
};

module.exports = triggerHasUniqueIds;
