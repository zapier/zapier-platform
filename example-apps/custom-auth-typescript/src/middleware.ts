import type { ZObject, Bundle, Authentication } from 'zapier-platform-core';

// This function runs after every outbound request. You can use it to check for
// errors or modify the response. You can have as many as you need. They'll need
// to each be registered in your index.js file.
const handleBadResponses = (response, z: ZObject, bundle: Bundle) => {
  if (response.status === 401) {
    throw new z.errors.Error(
      // This message is surfaced to the user
      'The API Key you supplied is incorrect',
      'AuthenticationError',
      response.status,
    );
  }

  return response;
};

// This function runs before every outbound request. You can have as many as you
// need. They'll need to each be registered in your index.js file.
const includeApiKey = (request, z: ZObject, bundle: Bundle) => {
  if (bundle.authData.apiKey) {
    // Use these lines to include the API key in the querystring
    request.params = request.params || {};
    request.params.api_key = bundle.authData.apiKey;

    // If you want to include the API key in the header instead, uncomment this:
    // request.headers.Authorization = bundle.authData.apiKey;
  }

  return request;
};

export const befores = [includeApiKey];

export const afters = [handleBadResponses];
