'use strict';
const btoa = (string) => {
  return new Buffer(string, 'binary').toString('base64');
};
module.exports = btoa;
