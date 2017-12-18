'use strict';

const crypto = require('crypto');

// Helpful handler for doing z.hash('sha256', 'my password')
const hashify = (algo, s, encoding, input_encoding) => {
  encoding = encoding || 'hex';
  input_encoding = input_encoding || 'binary';
  const hasher = crypto.createHash(algo);
  hasher.update(s, input_encoding);
  return hasher.digest(encoding);
};

// Clean up sensitive values in a hashed manner so they don't get logged.
const snipify = s => {
  if (typeof s !== 'string') {
    return null;
  }
  const length = s.length;
  s += process.env.SECRET_SALT || 'doesntmatterreally';
  const result = hashify('sha256', s);
  return `:censored:${length}:${result.substr(0, 10)}:`;
};

module.exports = {
  hashify,
  snipify
};
