'use strict';

const _ = require('lodash');

const requestClean = require('./request-clean');

// Stack requests on top of each other - deeply merging them.
const requestMerge = (requestOne, requestTwo) => {
  const baseRequest = {
    method: 'GET',
    params: {},
    headers: {
      'user-agent': 'Zapier'
    }
  };
  const requests = [baseRequest, requestOne, requestTwo];
  const request = _.merge.apply(_, requests.map(requestClean));
  requests.headers = requests.headers || {};
  request.headers = Object.keys(request.headers).reduce((coll, key) => {
    let val = request.headers[key];
    if (val === requestClean.DROP_DIRECTIVE) {
      delete coll[key];
    }
    return coll;
  }, request.headers);
  return request;
};

module.exports = requestMerge;
