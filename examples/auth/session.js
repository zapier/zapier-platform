const test = async (z /*, bundle */) => {
  // Normally you want to make a request to an endpoint that is either specifically designed to test auth, or one that
  // every user will have access to, such as an account or profile endpoint like /me.
  const response = await z.request({
    url: 'https://auth-json-server.zapier-staging.com/me'
  });

  if (response.status === 401) {
    // This message is surfaced to the user
    throw new Error('The Session Key you supplied is invalid');
  }

  // This method can return any truthy value to indicate the credentials are valid.
  return response;
};

// this function exchanges user-provided data for a token
const getSessionKey = async (z, bundle) => {
  const response = await z.request({
    method: 'POST',
    url: 'https://httpbin.zapier-tooling.com/post',
    body: {
      username: bundle.authData.username,
      password: bundle.authData.password
    }
  });

  if (response.status === 401) {
    throw new Error('The username/password you supplied is invalid');
  }

  return {
    sessionKey: response.json.sessionKey // || 'secret'
  };
};

// Middleware

// This function adds the session key to all outbound requests (made with `z.request`)
// It runs runs before each request is sent out, allowing you to make tweaks to the request in a centralized spot
const includeSessionKeyHeader = (request, z, bundle) => {
  if (bundle.authData.sessionKey) {
    request.headers = request.headers || {};
    request.headers['X-API-Key'] = bundle.authData.sessionKey;
  }
  return request;
};

// If we get a response and it is a 401, we can raise a special error (z.errors.RefreshAuthError)
// telling Zapier to retry the initial request with a refreshed token
const sessionRefreshIf401 = (response, z, bundle) => {
  if (bundle.authData.sessionKey) {
    if (response.status === 401) {
      throw new z.errors.RefreshAuthError('Session key needs refreshing.');
    }
  }
  return response;
};

module.exports = {
  config: {
    type: 'session',
    // Define any auth fields your app requires here. The user will be prompted to enter this info when
    // they connect their account.
    fields: [
      { key: 'username', label: 'Username', required: true, type: 'string' },
      { key: 'password', label: 'Password', required: true, type: 'password' }
    ],
    // The test method allows Zapier to verify that the credentials a user provides are valid. We'll execute this
    // method whenver a user connects their account for the first time.
    test,
    // The method that will exchange the fields provided by the user for session credentials.
    sessionConfig: {
      perform: getSessionKey
    },
    // assuming "username" is a key returned from the test
    connectionLabel: '{{username}}'
  },
  befores: [includeSessionKeyHeader],
  afters: [sessionRefreshIf401]
};
