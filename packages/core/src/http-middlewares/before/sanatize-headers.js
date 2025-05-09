'use strict';

// Middleware to trim whitespace from header keys and values
const sanitizeHeaders = (req) => {
  req.headers = Object.fromEntries(
    Object.entries(req.headers || {}).map(([key, value]) => [
      key.trim(),
      typeof value === 'string' ? value.trim() : value,
    ]),
  );
  return req;
};

module.exports = sanitizeHeaders;
