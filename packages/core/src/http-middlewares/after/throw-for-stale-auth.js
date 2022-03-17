'use strict';

const { RefreshAuthError } = require('../../errors');

/**
 * Raise a RefreshAuthError _before_ any other error handling happens. Behaves more closely to the 9.x behavior rather than 10.x
 */
const throwForStaleAuth = (resp) => {
  if (resp.status === 401) {
    throw new RefreshAuthError();
  }

  return resp;
};

module.exports = throwForStaleAuth;
