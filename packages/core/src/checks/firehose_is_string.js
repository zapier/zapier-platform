'use strict';

const _ = require('lodash');
const { simpleTruncate } = require('../tools/data');

const isFirehoseWebhook = require('./is-firehose-webhook');

/*
  Makes sure the results are all strings.
*/
const firehoseSubscriptionKeyIsString = {
  name: 'firehoseSubscriptionKeyIsString',
  shouldRun: isFirehoseWebhook,
  run: (method, results) => {
    if (!_.isArray(results)) {
      return []; // firehose-is-array check will catch if not array
    }

    const nonStringResult = _.find(results, (result) => {
      return !_.isString(result);
    });

    if (nonStringResult !== undefined) {
      const repr = simpleTruncate(JSON.stringify(nonStringResult), 50);
      return [
        `Got a non-string result in the array, expected only strings (${repr})`,
      ];
    }
    return [];
  },
};

module.exports = firehoseSubscriptionKeyIsString;
