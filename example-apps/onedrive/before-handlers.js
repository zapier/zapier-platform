'use strict';

// This adds the needed auth header to a request. By registering this on the
// app's `beforeRequest` section, every z.request() call will run this function.
const includeBearerToken = (request, z, bundle) => {
  if (bundle.authData.access_token) {
    request.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
  }
  return request;
};

module.exports = {
  includeBearerToken,
};
