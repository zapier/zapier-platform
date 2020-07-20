'use strict';
const STATUSES = require('../../constants').STATUSES;
const _ = require('lodash');
/*
this method creates the correct envelope responses if the app has used a callback url in their code
by signalling to Zapier that this app/method is returning a callback status the task will be placed
in a waiting state until the callback is called.
*/
const callbackStatusCatcher = (output) => {
  const input = output.input || {};

  const callbackUsed = _.get(input, '_zapier.event.callbackUsed');
  if (callbackUsed) {
    // output is an envelope so we can set status here
    output.status = STATUSES.CALLBACK;
  }
  return output;
};

module.exports = callbackStatusCatcher;
