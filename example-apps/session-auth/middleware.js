'use strict';

// This function runs before every outbound request. You can have as many as you
// need. They'll need to each be registered in your index.js file.
const includeSessionKeyHeader = (request, z, bundle) => {
  if (bundle.authData.sessionKey) {
    request.headers = request.headers || {};
    request.headers['X-API-Key'] = bundle.authData.sessionKey;
  }

  return request;
};

module.exports = { befores: [includeSessionKeyHeader], afters: [] };
