'use strict';

const throwForStatusMiddleware = (response) => {
  if (!response.skipThrowForStatus) {
    response.throwForStatus();
  }
  return response;
};

module.exports = throwForStatusMiddleware;
