'use strict';

const _ = require('lodash');

const requestClean = require('./request-clean');

// Do a merge with case-insensitive keys in the .header, and drop empty .header keys
const caseInsensitiveMerge = (requestOne, requestTwo, requestThree) => {
  // This creates copies/clones
  requestOne = requestClean(requestOne);
  requestTwo = requestClean(requestTwo);
  requestThree = requestClean(requestThree);

  // This is a very quick & efficient merge for all of request's properties
  const mergedRequest = _.merge(requestOne, requestTwo, requestThree);

  // Now to cleanup headers, we start on the last request (the one with priority) and work backwards to add the keys that don't already exist
  // NOTE: This is done "manually" instead of a _.merge or Object.assign() because we need case-insensitivity
  const mergedRequestHeaders = requestThree.headers || {};
  const requestTwoHeaders = requestTwo.headers || {};
  const requestOneHeaders = requestOne.headers || {};

  [requestTwoHeaders, requestOneHeaders].forEach((requestHeaders) => {
    const existingKeys = Object.keys(mergedRequestHeaders);
    const requestKeys = Object.keys(requestHeaders);

    requestKeys.forEach((checkingKey) => {
      const foundKeyIndex = _.findIndex(
        existingKeys,
        (key) => key.toLowerCase() === checkingKey.toLowerCase()
      );

      if (foundKeyIndex === -1) {
        mergedRequestHeaders[checkingKey] = requestHeaders[checkingKey];
      }
    });
  });

  // Remove "to drop" keys after all merging happened (instead of dropping and then getting it re-added)
  Object.keys(mergedRequestHeaders).forEach((key) => {
    if (mergedRequestHeaders[key] === requestClean.DROP_DIRECTIVE) {
      delete mergedRequestHeaders[key];
    }
  });

  mergedRequest.headers = mergedRequestHeaders;

  return mergedRequest;
};

// Stack requests on top of each other - deeply merging them.
const requestMerge = (requestOne, requestTwo) => {
  const baseRequest = {
    method: 'GET',
    params: {},
    headers: {
      'user-agent': 'Zapier',
    },
  };

  const request = caseInsensitiveMerge(baseRequest, requestOne, requestTwo);

  return request;
};

module.exports = requestMerge;
