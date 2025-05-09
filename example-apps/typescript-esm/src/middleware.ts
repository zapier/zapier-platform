import type { BeforeRequestMiddleware } from 'zapier-platform-core';

export const addBearerHeader: BeforeRequestMiddleware = (request, z, bundle) => {
  if (bundle.authData.access_token && !request.headers?.Authorization) {
    request.headers = {
      ...request.headers,
      Authorization: `Bearer ${bundle.authData.access_token}`,
    }
  }
  return request;
};
