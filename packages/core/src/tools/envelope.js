'use strict';

const _ = require('lodash');
const STATUSES = require('../constants').STATUSES;
/*
An envelope is a dumb "wrapper" for results - allowing us
to do fancy things in the future like add more context or
stash large results.
*/

const OUTPUT_ENVELOPE_TYPE = 'OutputEnvelope';

const isOutputEnvelope = (obj) =>
  _.isObject(obj) && obj.__type === OUTPUT_ENVELOPE_TYPE;
const ensureOutputEnvelope = (results) =>
  isOutputEnvelope(results)
    ? results
    : { __type: OUTPUT_ENVELOPE_TYPE, results, status: STATUSES.SUCCESS };

module.exports = {
  ensureOutputEnvelope,
  isOutputEnvelope,
};
