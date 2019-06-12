'use strict';
const atob = (string) => {
  return new Buffer(string, 'base64').toString('binary');
};
module.exports = atob;
