'use strict';

const _ = require('lodash');

const fetch = require('./fetch');
const requestSugar = require('./request-sugar');

const parseResponse = resp => {
  const contentType = resp.headers.get('Content-Type') || '';

  if (contentType.match(/^application\/json/)) {
    return resp.json().then(json => {
      resp.content = json;
      return resp;
    });
  }

  return resp.text().then(text => {
    resp.content = text;
    return resp;
  });
};

// Return our INTERNAL convenient flavor of resp. No middleware!
const request = options => {
  const fetchUrl = options.url;
  options = _.omit(options, 'url');

  return fetch(fetchUrl, options)
    .then(resp => {
      resp.options = options;
      return resp;
    })
    .then(parseResponse);
};

module.exports = requestSugar.addUrlOrOptions(request);
