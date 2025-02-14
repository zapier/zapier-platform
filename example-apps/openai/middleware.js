/* eslint-disable camelcase */
// This function runs after every outbound request. You can use it to check for
// errors or modify the response. You can have as many as you need. They'll need
// to each be registered in your index.js file.
const handleBadResponses = (response, z, bundle) => {
  if (response.data.error) {
    throw new z.errors.Error(
      response.data.error.message,
      response.data.error.code,
      response.status,
    );
  }

  return response;
};

const includeOrgId = (request, z, bundle) => {
  const { organization_id } = bundle.authData;
  if (organization_id) {
    request.headers['OpenAI-Organization'] = organization_id;
  }
  return request;
};

// This function runs before every outbound request. You can have as many as you
// need. They'll need to each be registered in your index.js file.
const includeApiKey = (request, z, bundle) => {
  const { api_key } = bundle.authData;
  if (api_key) {
    // Use these lines to include the API key in the querystring
    //   request.params = request.params || {};
    //   request.params.api_key = api_key;

    // If you want to include the API key in the header:
    request.headers.Authorization = `Bearer ${api_key}`;
  }

  return request;
};

const jsonHeaders = (request) => {
  request.headers['Content-Type'] = 'application/json';
  request.headers.Accept = 'application/json';
  return request;
};

module.exports = {
  befores: [includeApiKey, includeOrgId, jsonHeaders],
  afters: [handleBadResponses],
};
