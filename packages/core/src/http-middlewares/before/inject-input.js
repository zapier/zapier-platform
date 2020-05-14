'use strict';

const _ = require('lodash');

/*
   Creates HTTP before middleware that adds some app context
   to HTTP request options, including the app and event.

   Useful for HTTP middlewares that need stuff from the app or event.
 */
const injectInput = (input) => {
  return (req) => _.extend({}, req, { input });
};

module.exports = injectInput;
