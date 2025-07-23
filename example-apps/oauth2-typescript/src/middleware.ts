import type { ZObject, Bundle, Authentication } from 'zapier-platform-core';

// This function runs before every outbound request. You can have as many as you
// need. They'll need to each be registered in your index.js file.
const includeBearerToken = (request, z: ZObject, bundle: Bundle) => {
  if (bundle.authData.access_token) {
    request.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
  }

  return request;
};

export const befores = [includeBearerToken];

export const afters = [];
