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
  if (
    (autostashLimit &&
      size >= constants.RESPONSE_SIZE_LIMIT &&
      size <= autostashLimit) ||
    autostashLimit === -1
  ) {
    const url = await responseStasher(output.input, payload);
    output.resultsUrl = url;
    output.results = Array.isArray(output.results) ? [] : {};
  } else if (autostashLimit && size > autostashLimit) {
    // If the limit is defined and is out of range, throw a descriptive error
    // indicating the size of the response and the autostash limit
    throw new Error(
      `Response size of ${size} bytes exceeds maximum allowed size: ${autostashLimit}`,
    );
  }
  return output;
};

module.exports = largeResponseCachePointer;
