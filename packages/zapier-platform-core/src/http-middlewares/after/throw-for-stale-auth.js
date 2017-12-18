'use strict';

const errors = require('../../errors');

const throwForStaleAuth = resp => {
  if (resp.status === 401) {
    const message = `Got ${resp.status} calling ${resp.request.method} ${
      resp.request.url
    }, triggering auth refresh.`;
    throw new errors.RefreshAuthError(message);
  }

  return resp;
};

module.exports = throwForStaleAuth;
