'use strict';

const constants = require('../../constants');
const cleaner = require('../../tools/cleaner');

/*
  TODO: Some services _do not_ enjoy having 6mb+ responses returned, so
  we may need to user/request pre-signed S3 URLs (or somewhere else?)
  to stash the large response, and return a pointer.
*/
const largeResponseCachePointer = output => {
  const size = JSON.stringify(cleaner.maskOutput(output)).length;
  if (size > constants.RESPONSE_SIZE_LIMIT) {
    console.log(
      `Oh no! Payload is ${size}, which is larger than ${
        constants.RESPONSE_SIZE_LIMIT
      }.`
    );
    // TODO: use envelope feature and to build RPC to get signed S3 upload URL.
  }
  return output;
};

module.exports = largeResponseCachePointer;
