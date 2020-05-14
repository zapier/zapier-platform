'use strict';

const _ = require('lodash');

// this returns a higher order function that allows users to generate the callback URL
// generation doesn't actually generate the URL (although we could use RPC if we wanted to)
// instead it relies on the callbackUrl being passed in by the platform
// as such it'll always return the same value.
// calling this inner function will also mark the task as a CALLBACK status on return which will
// effectively pause the Zap

const createCallbackHigherOrderFunction = (input) => {
  const callbackUrl = _.get(input, '_zapier.event.callback_url');
  return () => {
    _.set(input, '_zapier.event.callbackUsed', true);
    return callbackUrl;
  };
};

module.exports = createCallbackHigherOrderFunction;
