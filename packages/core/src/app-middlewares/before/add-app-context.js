'use strict';

const _ = require('lodash');

// remove sensitive data from bundle before logging
const logSafeBundle = (bundle) => {
  return _.omit(bundle, 'authData');
};

/*
   Before middleware that adds a bit of human stack frame context
*/
const addAppContext = (input) => {
  const methodName = _.get(input, '_zapier.event.method');
  input._zapier.whatHappened.push(`Executing ${methodName} with bundle`);

  const bundle = _.get(input, '_zapier.event.bundle', {});
  if (Object.keys(bundle).length > 0) {
    input._zapier.whatHappened.push(JSON.stringify(logSafeBundle(bundle)));
  }

  return input;
};

module.exports = addAppContext;
