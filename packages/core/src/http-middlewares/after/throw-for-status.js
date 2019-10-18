'use strict';

const { stripQueryFromURL } = require('../../tools/http');

const throwForStatus = resp => {
  if (resp.status > 300) {
    const cleanURL = stripQueryFromURL(resp.request.url);
    const message = `Got ${resp.status} calling ${resp.request.method} ${cleanURL}, expected 2xx.`;
    throw new Error(message);
  }

  return resp;
};

module.exports = throwForStatus;
