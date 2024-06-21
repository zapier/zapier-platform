'use strict';

const constants = require('../../constants');
const cleaner = require('../../tools/cleaner');
const responseStasher = require('../../tools/create-response-stasher');

const largeResponseCachePointer = async (output) => {
  const response = cleaner.maskOutput(output);

  const autostashOutputLimit =
    output.input._zapier.event.autostashPayloadOutputLimit;

  const payload = JSON.stringify(response.results);
  const size = payload.length;
  if (size > constants.RESPONSE_SIZE_LIMIT) {
    console.log(
      `Oh no! Payload is ${size}, which is larger than ${constants.RESPONSE_SIZE_LIMIT}.`
    );

    // Stash if response is larger than lambda limit, but smaller than autostash limit
    // otherwise, let lambda deal with it
    if (autostashOutputLimit && size <= autostashOutputLimit) {
      const url = await responseStasher(output.input, payload, size);
      output.resultsUrl = url;
      output.results = Array.isArray(output.results) ? [] : {};
    }
  }
  return output;
};

module.exports = largeResponseCachePointer;
