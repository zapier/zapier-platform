'use strict';

const http = require('http');
const https = require('https');

const httpAgent = new http.Agent({ rejectUnauthorized: false });
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const disableSSLCertCheck = (req) => {
  if (req.agent) {
    req.agent.options.rejectUnauthorized = false;
  } else if (req.url.startsWith('https://')) {
    // Need to dynamically choose a different agent because redirection can be
    // across HTTPS and HTTP.
    // See https://github.com/node-fetch/node-fetch/tree/6ee9d318#custom-agent
    req.agent = (parsedURL) =>
      parsedURL.protocol === 'http:' ? httpAgent : httpsAgent;
  }
  return req;
};

module.exports = disableSSLCertCheck;
