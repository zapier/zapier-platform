'use strict';

const util = require('util');
const _ = require('lodash');

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

class ResponseError extends Error {
  constructor(response) {
    let content;
    try {
      content = response.content;
    } catch (err) {
      // Stream request (z.request({raw: true})) doesn't have response.content
      content = null;
    }

    super(
      JSON.stringify({
        status: response.status,
        headers: {
          'content-type': response.headers.get('content-type'),
          'retry-after': response.headers.get('retry-after'),
        },
        content,
        request: {
          url: response.request.url,
        },
      }),
    );
    this.name = 'ResponseError';
    this.doNotContextify = true;
  }
}

class ThrottledError extends Error {
  constructor(message, delay) {
    super(
      JSON.stringify({
        message,
        delay,
      }),
    );
    this.name = 'ThrottledError';
    this.doNotContextify = true;
  }
}

// Make some of the errors we'll use!
const createError = (name) => {
  const NewError = function (message = '') {
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
  'StopRequestError',
];

const exceptions = _.reduce(
  names,
  (col, name) => {
    col[name] = createError(name);
    return col;
  },
  {
    Error: AppError,
    ResponseError,
    ThrottledError,
  },
);

const isRequireError = ({ name, message }) =>
  name === 'ReferenceError' && message === 'require is not defined';

const handleError = (...args) => {
  const [error] = args;
  const { RequireModuleError } = exceptions;
  if (isRequireError(error)) {
    throw new RequireModuleError(
      'For technical reasons, use z.require() instead of require().',
    );
  }

  throw error;
};

module.exports = {
  ...exceptions,
  handleError,
};
