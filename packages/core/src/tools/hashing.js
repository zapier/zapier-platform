'use strict';

const crypto = require('crypto');

// Helpful handler for doing z.hash('sha256', 'my password')
const hashify = (algo, s, encoding, inputEncoding) => {
  encoding = encoding || 'hex';
  inputEncoding = inputEncoding || 'binary';
  const hasher = crypto.createHash(algo);
  hasher.update(s, inputEncoding);
  return hasher.digest(encoding);
};

// Clean up sensitive values in a hashed manner so they don't get logged.
const snipify = (s) => {
  if (!['string', 'number'].includes(typeof s)) {
    return null;
  }
  const str = String(s);
  const length = str.length;
  const salted = str + (process.env.SECRET_SALT || 'doesntmatterreally');
  const hashed = hashify('sha256', salted);
  return `:censored:${length}:${hashed.substr(0, 10)}:`;
};

const md5 = (s) => crypto.createHash('md5').update(s).digest('hex');

module.exports = {
  hashify,
  md5,
  snipify,
};
