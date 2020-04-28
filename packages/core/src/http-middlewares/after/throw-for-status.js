'use strict';

const errors = require('../../errors');

const throwForStatus = response => {
  if (!response.skipThrowForStatus && response.status > 300) {
    throw new errors.ResponseError(response);
  }

  return response;
};

module.exports = throwForStatus;
