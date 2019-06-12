'use strict';

const throwForStatus = resp => {
  if (resp.status > 300) {
    const message = `Got ${resp.status} calling ${resp.request.method} ${
      resp.request.url
    }, expected 2xx.`;
    throw new Error(message);
  }

  return resp;
};

module.exports = throwForStatus;
