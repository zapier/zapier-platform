'use strict';

const fetch = require('./fetch');
const requestSugar = require('./request-sugar');
const { PACKAGE_NAME, PACKAGE_VERSION } = require('../constants');

const parseResponse = async (resp) => {
  const contentType = resp.headers.get('Content-Type') || '';

  if (contentType.match(/^application\/json/)) {
    const json = await resp.json();
    resp.content = json;

    return resp;
  }

  const text = await resp.text();
  resp.content = text;

  return resp;
};

// Return our INTERNAL convenient flavor of resp. No middleware!
const request = async (options) => {
  const { url: fetchUrl, ...fetchOptions } = options;

  fetchOptions.headers = {
    'user-agent': `${PACKAGE_NAME}/${PACKAGE_VERSION}`,
    ...(fetchOptions.headers || {}),
  };

  const resp = await fetch(fetchUrl, fetchOptions);
  resp.options = fetchOptions;

  return parseResponse(resp);
};

module.exports = requestSugar.addUrlOrOptions(request);
