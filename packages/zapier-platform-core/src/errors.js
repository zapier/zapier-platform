'use strict';

const _ = require('lodash');
const util = require('util');

// Make some of the errors we'll use!
const createError = name => {
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
  'DehydrateError',
  'NotImplementedError',
  'MethodDoesNotExist',
  'RefreshAuthError',
  'CheckError'
];

const exceptions = _.reduce(
  names,
  (col, name) => {
    col[name] = createError(name);
    return col;
  },
  {}
);

module.exports = exceptions;
