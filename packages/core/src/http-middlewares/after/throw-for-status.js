'use strict';

const errors = require('../../errors');

const throwForStatus = (response) => {
  if (
    !response.skipThrowForStatus &&
    response.status >= 400 &&
    response.status < 600
  ) {
    throw new errors.ResponseError(response);
  }

  return response;
};

module.exports = throwForStatus;
