'use strict';

const _ = require('lodash');
const util = require('util');

// Make some of the errors we'll use!
const createError = (name) => {
  const NewError = function(message) {
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
];

const cliErrors = _.reduce(names, (error, name) => {
  error[name] = createError(name);
  return error;
}, {});

const exceptions = {
  ErrorException: Error,
  HaltedException: cliErrors.HaltedError,
  StopRequestException: cliErrors.StopRequestError,
  ExpiredAuthException: cliErrors.ExpiredAuthError,
  RefreshTokenException: cliErrors.RefreshAuthError,
  InvalidSessionException: cliErrors.RefreshAuthError, // In CLI, RefreshAuthError works the same for both OAuth and Session
};

module.exports = exceptions;
