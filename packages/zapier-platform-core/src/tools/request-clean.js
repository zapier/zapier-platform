'use strict';

const _ = require('lodash');
const querystring = require('querystring');

const DROP_DIRECTIVE = '$$DROP$$';

// Drop falsy values so they don't overwrite during the merge
// since objects are case-sensitive but HTTP headers aren't.
const requestClean = (request) => {
  if (!request) {
    return {};
  }

  // we used to do deep copying - but it breaks request.body if stream/buffer
  request = _.clone(request);

  if (request.method && typeof request.method === 'string') {
    request.method = request.method.toUpperCase();
  } else {
    delete request.method;
  }

  if (!request.url) {
    delete request.url;
  } else if (request.url.indexOf('?') !== -1) {
    request.params = _.merge(
      {},
      request.params || {},
      querystring.parse(request.url.split('?').slice(1).join('?'))
    );
    request.url = request.url.split('?')[0];
  }

  if (!request.params) {
    delete request.params;
  }
  if (!request.body) {
    delete request.body;
  }

  request.headers = request.headers || {};
  request.headers = Object.keys(request.headers).reduce((coll, key) => {
    let val = request.headers[key];
    if (!val) {
      val = DROP_DIRECTIVE;
    }
    coll[String(key)] = val;
    return coll;
  }, {});

  return request;
};

requestClean.DROP_DIRECTIVE = DROP_DIRECTIVE;

module.exports = requestClean;
