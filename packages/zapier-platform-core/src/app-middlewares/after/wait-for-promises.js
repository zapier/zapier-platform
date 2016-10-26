'use strict';

const ZapierPromise = require('../../tools/promise');

/*
  After app middlewares that waits for all pending promises to resolve.
*/
const waitForPromises = (output) => {
  return ZapierPromise.all(output.input._zapier.promises || [])
    .catch(() => {}) // drop any errors in waiting promises
    .then(() => output);
};

module.exports = waitForPromises;
