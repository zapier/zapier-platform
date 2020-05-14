'use strict';
const btoa = (string) => {
  return Buffer.from(string, 'binary').toString('base64');
};
module.exports = btoa;
