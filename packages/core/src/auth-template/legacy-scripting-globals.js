'use strict';

// Exception classes, encoding helpers, and a partial z used by legacy
// scriptingSource files. Ported from zapier-platform-legacy-scripting-runner's
// exceptions.js/atob.js/btoa.js/zfactory.js — core can't depend on that
// package (it depends on core), so these are duplicated here rather than
// shared.

const crypto = require('crypto');
const util = require('util');
const lodash = require('lodash');

class AppError extends Error {
  constructor(message, code, status) {
    super(JSON.stringify({ message, code, status }));
    this.name = 'AppError';
    this.doNotContextify = true;
  }
}

const createError = (name) => {
  const NewError = function (message) {
    this.name = name;
    this.message = message || '';
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
  };
  util.inherits(NewError, Error);
  return NewError;
};

const errorNames = [
  'HaltedError',
  'StopRequestError',
  'ExpiredAuthError',
  'RefreshAuthError',
  'DehydrateError',
];

const cliErrors = lodash.reduce(
  errorNames,
  (error, name) => {
    error[name] = createError(name);
    return error;
  },
  { Error: AppError },
);

const atob = (string) => Buffer.from(string, 'base64').toString('binary');
const btoa = (string) => Buffer.from(string, 'binary').toString('base64');

const legacyZ = {
  JSON: {
    parse: (str) => {
      try {
        return JSON.parse(str);
      } catch {
        const preview = str && str.length > 100 ? str.substr(0, 100) : str;
        throw new Error(`Error parsing response. We got: "${preview}"`);
      }
    },
    stringify: (obj) => JSON.stringify(obj),
  },
  hash: (algorithm, string, encoding = 'hex', inputEncoding = 'binary') => {
    const hasher = crypto.createHash(algorithm);
    hasher.update(string, inputEncoding);
    return hasher.digest(encoding);
  },
  hmac: (algorithm, key, string, encoding = 'hex') => {
    const hasher = crypto.createHmac(algorithm, key);
    hasher.update(string);
    return hasher.digest(encoding);
  },
  snipify: (string) => {
    if (!lodash.isString(string)) {
      return null;
    }
    const salt = process.env.SECRET_SALT || 'doesntmatterreally';
    const result = legacyZ.hash('sha256', string + salt);
    return `:censored:${string.length}:${result.substr(0, 10)}:`;
  },
};

module.exports = {
  ErrorException: cliErrors.Error,
  HaltedException: cliErrors.HaltedError,
  StopRequestException: cliErrors.StopRequestError,
  ExpiredAuthException: cliErrors.ExpiredAuthError,
  RefreshTokenException: cliErrors.RefreshAuthError,
  InvalidSessionException: cliErrors.RefreshAuthError,
  atob,
  btoa,
  legacyZ,
};
