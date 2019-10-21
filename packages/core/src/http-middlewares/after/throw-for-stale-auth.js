'use strict';

const { stripQueryFromURL } = require('../../tools/http');

const errors = require('../../errors');

const throwForStaleAuth = resp => {
  if (resp.status === 401) {
    const cleanURL = stripQueryFromURL(resp.request.url);
    const message = `Got ${resp.status} calling ${resp.request.method} ${cleanURL}, triggering auth refresh.`;
    throw new errors.RefreshAuthError(message);
  }

  return resp;
};

module.exports = throwForStaleAuth;
