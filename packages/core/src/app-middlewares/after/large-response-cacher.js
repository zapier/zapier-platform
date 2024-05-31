'use strict';

const constants = require('../../constants');
const cleaner = require('../../tools/cleaner');
const createResponseStasher = require('../../tools/create-response-stasher');

/*
  TODO: Some services _do not_ enjoy having 6mb+ responses returned, so
  we may need to user/request pre-signed S3 URLs (or somewhere else?)
  to stash the large response, and return a pointer.
*/
const largeResponseCachePointer = async (output) => {
  const response = cleaner.maskOutput(output);
  const size = JSON.stringify(response).length;
  if (size > constants.RESPONSE_SIZE_LIMIT) {
    console.log(
      `Oh no! Payload is ${size}, which is larger than ${constants.RESPONSE_SIZE_LIMIT}.`
    );

    const stasher = createResponseStasher(output.input);
    const url = await stasher(JSON.stringify(output));

    output.resultsUrl = url;
    output.results = [];
  }
  return output;
};

module.exports = largeResponseCachePointer;
