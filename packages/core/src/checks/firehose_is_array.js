'use strict';

const _ = require('lodash');
const { simpleTruncate } = require('../tools/data');

const isFirehoseWebhook = require('./is-firehose-webhook');

/*
  The firehoseWebhook performSubscriptionKeyList function should always return an array of objects.
*/
const firehoseSubscriptionIsArray = {
  name: 'firehoseSubscriptionIsArray',
  shouldRun: isFirehoseWebhook,
  run: (method, results) => {
    if (!_.isArray(results)) {
      const repr = simpleTruncate(JSON.stringify(results), 50);
      return [`Results must be an array, got: ${typeof results}, (${repr})`];
    }
    return [];
  },
};

module.exports = firehoseSubscriptionIsArray;
