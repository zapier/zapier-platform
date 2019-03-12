'use strict';

const util = require('util');
const _ = require('lodash');

// Make some of the errors we'll use!
const createError = name => {
  const NewError = function(message = '') {
    this.name = name;
    this.message = message;
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
  };
  util.inherits(NewError, Error);
  return NewError;
};

const names = [
  'CheckError',
  'DehydrateError',
  'ExpiredAuthError',
  'HaltedError',
  'MethodDoesNotExist',
  'NotImplementedError',
  'RefreshAuthError',
  'RequireModuleError',
  'StopRequestError'
];

const exceptions = _.reduce(
  names,
  (col, name) => {
    col[name] = createError(name);
    return col;
  },
  {}
);

const isRequireError = ({ name, message }) =>
  name === 'ReferenceError' && message === 'require is not defined';

const handleError = (...args) => {
  const [error] = args;
  const { RequireModuleError } = exceptions;
  if (isRequireError(error)) {
    throw new RequireModuleError(
      'For technical reasons, use z.require() instead of require().'
    );
  }

  throw error;
};

module.exports = {
  ...exceptions,
  handleError
};
