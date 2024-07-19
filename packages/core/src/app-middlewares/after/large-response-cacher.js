'use strict';

const constants = require('../../constants');
const cleaner = require('../../tools/cleaner');
const responseStasher = require('../../tools/create-response-stasher');

const largeResponseCachePointer = async (output) => {
  const response = cleaner.maskOutput(output);
  if (!response.results) {
    return output;
  }

  const autostashLimit = output.input._zapier.event.autostashPayloadOutputLimit;

  const payload = JSON.stringify(response.results);
  const size = payload.length;

  // If autostash limit is defined, and is within the range, stash the response
  // If it is -1, stash the response regardless of size
  // If the limit is defined and is out of range, let lambda deal with it
  if (
    (autostashLimit &&
      size >= constants.RESPONSE_SIZE_LIMIT &&
      size <= autostashLimit) ||
    autostashLimit === -1
  ) {
    const url = await responseStasher(output.input, payload);
    output.resultsUrl = url;
    output.results = Array.isArray(output.results) ? [] : {};
  }
  return output;
};

module.exports = largeResponseCachePointer;
