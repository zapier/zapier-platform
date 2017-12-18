'use strict';

const _ = require('lodash');

/*
  Sugarize http request options.
*/
const createRequestOptions = (url, options) => {
  return typeof url === 'string' ? _.extend({}, options, { url }) : url;
};

/*
  Allow request invocations like this:

  request('http://foo.com);

  Or this:

  const options = { headers: {A: 'B} };
  request('http://foo.com', options);

  Or this:

  const options = { url: 'http://foo.com', headers: {A: 'B} };
  request(options);
*/
const addUrlOrOptions = requestFn => {
  return (url, options) => {
    return requestFn(createRequestOptions(url, options));
  };
};

module.exports = {
  createRequestOptions,
  addUrlOrOptions
};
