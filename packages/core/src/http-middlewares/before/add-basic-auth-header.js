'use strict';

// Computes the basic auth header for the request
const addBasicAuthHeader = (req, z, bundle) => {
  if (bundle.authData && bundle.authData.username && bundle.authData.password) {
    const buff = Buffer.from(
      `${bundle.authData.username}:${bundle.authData.password}`,
      'utf8'
    );
    const header = 'Basic ' + buff.toString('base64');

    if (req.headers) {
      req.headers.Authorization = header;
    } else {
      req.headers = {
        Authorization: header
      };
    }
  }
  return req;
};

module.exports = addBasicAuthHeader;
