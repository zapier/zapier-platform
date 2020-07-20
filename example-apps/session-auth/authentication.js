'use strict';

// You want to make a request to an endpoint that is either specifically designed
// to test auth, or one that every user will have access to. eg: `/me`.
// By returning the entire request object, you have access to the request and
// response data for testing purposes. Your connection label can access any data
// from the returned response using the `json.` prefix. eg: `{{json.username}}`.
const test = (z, bundle) =>
  z.request({ url: 'https://auth-json-server.zapier-staging.com/me' });

// This function runs after every outbound request. You can use it to check for
// errors or modify the response. You can have as many as you need. They'll need
// to each be registered in your index.js file.
const handleBadResponses = (response, z, bundle) => {
  if (response.status === 401) {
    throw new z.errors.Error(
      // This message is surfaced to the user
      'The session key you supplied is incorrect',
      'AuthenticationError',
      response.status
    );
  }

  return response;
};

const getSessionKey = async (z, bundle) => {
  const response = await z.request({
    url: 'https://httpbin.zapier-tooling.com/post',
    method: 'POST',
    body: {
      username: bundle.authData.username,
      password: bundle.authData.password,
    },
  });

  if (response.status !== 200) {
    throw new z.errors.Error(
      // This message is surfaced to the user
      'The username/password you supplied is invalid',
      'getSessionKeyError',
      response.status
    );
  }

  return {
    // FIXME: The `|| "secret"` below is just for demo purposes, you should remove it.
    sessionKey: response.data.sessionKey || 'secret',
  };
};

// This function runs before every outbound request. You can have as many as you
// need. They'll need to each be registered in your index.js file.
const includeSessionKeyHeader = (request, z, bundle) => {
  if (bundle.authData.sessionKey) {
    request.headers = request.headers || {};
    request.headers['X-API-Key'] = bundle.authData.sessionKey;
  }

  return request;
};

// This function runs after every outbound request. You can use it to check for
// errors or modify the response. You can have as many as you need. They'll need
// to each be registered in your index.js file.
const sessionRefreshIf401 = (response, z, bundle) => {
  if (bundle.authData.sessionKey && response.status === 401) {
    throw new z.errors.RefreshAuthError('Session key needs refreshing.');
  }

  return response;
};

module.exports = {
  config: {
    // "session" auth exchanges user data for a different session token (that may be
    // periodically refreshed")
    type: 'session',
    sessionConfig: { perform: getSessionKey },

    // Define any input app's auth requires here. The user will be prompted to enter
    // this info when they connect their account.
    fields: [
      { key: 'username', label: 'Username', required: 'true' },
      {
        key: 'password',
        label: 'Password',
        required: true,

        // this lets the user enter maksed data
        type: 'password',
      },
    ],

    // The test method allows Zapier to verify that the credentials a user provides
    // are valid. We'll execute this method whenver a user connects their account for
    // the first time.
    test,

    // This template string can access all the data returned from the auth test. If
    // you return the test object, you'll access the returned data with a label like
    // `{{json.X}}`. If you return `response.data` from your test, then your label can
    // be `{{X}}`. This can also be a function that returns a label. That function has
    // the standard args `(z, bundle)` and data returned from the test can be accessed
    // in `bundle.inputData.X`.
    connectionLabel: '{{json.username}}',
  },
  befores: [includeSessionKeyHeader],
  afters: [sessionRefreshIf401, handleBadResponses],
};
