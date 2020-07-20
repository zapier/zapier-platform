'use strict';

const _ = require('lodash');

const parse = (str) => {
  const newError = (message) => {
    const error = new SyntaxError(message);
    Error.captureStackTrace(error, parse);
    return error;
  };

  if (!_.isString(str)) {
    throw newError(`Error parsing response. "${str}" is not a string.`);
  }

  try {
    return JSON.parse(str);
  } catch (err) {
    const preview = str.substr(0, 100);
    throw newError(`Error parsing response. We got: "${preview}"`);
  }
};

// Similar API to JSON built in but catches errors with nicer tracebacks.
const createJSONtool = () => {
  return {
    parse,
    stringify: JSON.stringify,
  };
};

module.exports = createJSONtool;
