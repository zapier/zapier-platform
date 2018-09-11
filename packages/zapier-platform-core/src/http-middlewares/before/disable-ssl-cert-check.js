'use strict';

const https = require('https');

const disableSSLCertCheck = req => {
  if (req.agent) {
    req.agent.options.rejectUnauthorized = false;
  } else {
    req.agent = new https.Agent({ rejectUnauthorized: false });
  }
  return req;
};

module.exports = disableSSLCertCheck;
