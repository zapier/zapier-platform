'use strict';
const atob = (string) => {
  return Buffer.from(string, 'base64').toString('binary');
};
module.exports = atob;
