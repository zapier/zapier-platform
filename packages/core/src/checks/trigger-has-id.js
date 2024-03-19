'use strict';

const _ = require('lodash');
const { simpleTruncate } = require('../tools/data');

const isTrigger = require('./is-trigger');

/*
  Makes sure the results all have an ID in them.
*/
const triggerHasId = {
  name: 'triggerHasId',
  shouldRun: (method, bundle, compiledApp) => {
    // Hooks will have a bundle.cleanedRequest and we don't need to check they've got an id
    if (!isTrigger(method) || bundle.cleanedRequest) {
      return false;
    }
    const triggerKey = method.split('.', 2)[1];
    if (!triggerKey) {
      // Unreachable, but just in case
      return false;
    }

    const outputFields = _.get(compiledApp, [
      'triggers',
      triggerKey,
      'operation',
      'outputFields',
    ]);

    if (!outputFields || !Array.isArray(outputFields)) {
      return true;
    }

    // This check is only necessary if either:
    // - field.primary not set for all fields
    // - field.primary is set for `id` field
    let hasPrimary = false;
    for (const field of outputFields) {
      if (!field) {
        continue; // just in case
      }
      if (field.primary) {
        if (field.key === 'id') {
          return true;
        } else {
          hasPrimary = true;
        }
      }
    }
    return !hasPrimary;
  },
  run: (method, results) => {
    const missingIdResult = _.find(results, (result) => {
      return !result || _.isUndefined(result.id) || _.isNull(result.id);
    });

    if (missingIdResult) {
      const repr = simpleTruncate(JSON.stringify(missingIdResult), 250);
      return [`Got a result missing the "id" property (${repr})`];
    }
    return [];
  },
};

module.exports = triggerHasId;
