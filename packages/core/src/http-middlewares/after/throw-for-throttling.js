'use strict';

const { ThrottledError } = require('../../errors');

/**
 * Raise a ThrottledError for 429 responses _before_ dev's afterResponse middleware,
 * unless throwForThrottlingEarly is set to true on the request.
 * Behaves similarly to throwForStaleAuth but for throttling.
 */
const throwForThrottling = (resp) => {
  // throwForThrottlingEarly has to be explicitly set to false to disable this
  // middleware. By default, when it's undefined or null, we want this
  // middleware to run.
  if (resp.request?.throwForThrottlingEarly === false) {
    return resp;
  }

  if (resp.status === 429) {
    const retryAfter = resp.headers.get('retry-after');
    let delay = retryAfter ? parseInt(retryAfter, 10) : null;
    if (Number.isNaN(delay)) {
      delay = null;
    }
    throw new ThrottledError(
      'The server returned 429 (Too Many Requests)',
      delay,
    );
  }

  return resp;
};

module.exports = throwForThrottling;
