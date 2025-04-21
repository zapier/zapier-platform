'use strict';

/*
  After app middlewares that waits for all pending promises to resolve.
*/
const waitForPromises = (output) => {
  return Promise.all(output.input._zapier.promises || [])
    .catch(() => {}) // drop any errors in waiting promises
    .then(() => output);
};

module.exports = waitForPromises;
