'use strict';

const errors = require('../../errors');

const throwForStatus = (response) => {
  if (response.skipThrowForStatus) {
    return response;
  }

  // eslint-disable-next-line yoda
  if (400 <= response.status && response.status < 600) {
    throw new errors.ResponseError(response);
  }

  return response;
};

module.exports = throwForStatus;
