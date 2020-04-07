'use strict';

const errors = require('../../errors');

const throwForStatus = resp => {
  if (resp.status > 300) {
    throw new errors.ResponseError(resp);
  }

  return resp;
};

module.exports = throwForStatus;
