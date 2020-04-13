const test = async (z /*, bundle */) => {
  // Normally you want to make a request to an endpoint that is either specifically designed to test auth, or one that
  // every user will have access to, such as an account or profile endpoint like /me.
  const response = await z.request({
    url: 'https://auth-json-server.zapier-staging.com/me'
  });

  if (response.status === 401) {
    // This message is surfaced to the user
    throw new z.errors.Error(
      'The API Key you supplied is invalid',
      'AuthenticationError',
      response.status
    );
  }
  return response;
};

// To include the API key on all outbound requests, simply define a function here.
// It runs runs before each request is sent out, allowing you to make tweaks to the request in a centralized spot.
const includeApiKey = (request, z, bundle) => {
  if (bundle.authData.apiKey) {
    // include the key in the querystring:
    request.params = request.params || {};
    request.params.api_key = bundle.authData.apiKey;

    // If you want to include the key as a header instead:
    // request.headers.Authorization = bundle.authData.apiKey;
  }
  return request;
};

module.exports = {
  config: {
    // 'custom' is the cathc-all auth type. The user supplies some info and Zapier can make authenticated requests with it
    type: 'custom',
    // Define any auth fields your app requires here. The user will be prompted to enter this info when they connect their account.
    fields: [
      { key: 'apiKey', label: 'API Key', required: true, type: 'string' }
    ],

    // The test method allows Zapier to verify that the credentials a user provides are valid. We'll execute this
    // method whenver a user connects their account for the first time.
    test,

    // this can be a "{{string}}" or a function
    connectionLabel: (z, bundle) => {
      return bundle.inputData.username;
    }
  },
  befores: [includeApiKey]
};
