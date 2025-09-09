'use strict';

const { ThrottledError } = require('../../errors');

/**
 * Raise a ThrottledError for 429 responses _before_ dev's afterResponse middleware,
 * unless throwForThrottlingEarly is set to true on the request.
 * Behaves similarly to throwForStaleAuth but for throttling.
 */
const throwForThrottling = (resp) => {
  // Skip if throwForThrottlingEarly is explicitly true (backwards compatible behavior)
  if (resp.request?.throwForThrottlingEarly === true) {
    return resp;
  }

  if (resp.status === 429) {
    const retryAfter = resp.headers.get('retry-after');
    const delay = retryAfter ? parseInt(retryAfter, 10) : null;
    throw new ThrottledError('Too Many Requests', delay);
  }

  return resp;
};

module.exports = throwForThrottling;
