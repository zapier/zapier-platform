'use strict';

const errors = require('../../errors');

/**
 * The server-side will raise `RefreshAuthError` when `autoRefresh === true`.
 * Once we always run `throwForStatus` or a custom `afterResponse`, we can drop `throwForStaleAuth`.
 */
const throwForStaleAuth = resp => {
  if (resp.status === 401) {
    throw new errors.ResponseError(resp);
  }

  return resp;
};

module.exports = throwForStaleAuth;
