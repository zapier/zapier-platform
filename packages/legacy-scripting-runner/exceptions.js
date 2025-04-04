'use strict';

const _ = require('lodash');
const util = require('util');

class AppError extends Error {
  constructor(message, code, status) {
    super(
      JSON.stringify({
        message,
        code,
        status,
      }),
    );
    this.name = 'AppError';
    this.doNotContextify = true;
  }
}

// Make some of the errors we'll use!
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

const names = [
  'HaltedError',
  'StopRequestError',
  'ExpiredAuthError',
  'RefreshAuthError',
  'DehydrateError',
];

const cliErrors = _.reduce(
  names,
  (error, name) => {
    error[name] = createError(name);
    return error;
  },
  {
    Error: AppError,
  },
);

const exceptions = {
  ErrorException: cliErrors.Error,
  HaltedException: cliErrors.HaltedError,
  StopRequestException: cliErrors.StopRequestError,
  ExpiredAuthException: cliErrors.ExpiredAuthError,
  RefreshTokenException: cliErrors.RefreshAuthError,
  InvalidSessionException: cliErrors.RefreshAuthError, // In CLI, RefreshAuthError works the same for both OAuth and Session
  DehydrateException: cliErrors.DehydrateError,
};

const DEFINED_ERROR_NAMES = ['AppError', ...names];

module.exports = {
  ...exceptions,
  DEFINED_ERROR_NAMES,
};
