'use strict';

const _ = require('lodash');

// remove sensitive data from bundle before logging
const logSafeBundle = bundle => {
  return _.omit(bundle, 'authData');
};

/*
   Before middleware that adds a bit of human stack frame context
*/
const addAppContext = input => {
  const methodName = _.get(input, '_zapier.event.method');
  const bundle = _.get(input, '_zapier.event.bundle', {});

  input._addContext(
    `Executing ${methodName} with bundle`,
    JSON.stringify(logSafeBundle(bundle))
  );
  return input;
};

module.exports = addAppContext;
