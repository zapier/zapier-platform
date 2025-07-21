import type { ZObject, Bundle, Authentication } from 'zapier-platform-core';

// You want to make a request to an endpoint that is either specifically designed
// to test auth, or one that every user will have access to. eg: `/me`.
// By returning the entire request object, you have access to the request and
// response data for testing purposes. Your connection label can access any data
// from the returned response using the `json.` prefix. eg: `{{json.username}}`.
const test = (z: ZObject, bundle: Bundle) =>
  z.request({ url: 'https://auth-json-server.zapier-staging.com/me' });

const getSessionKey = async (z: ZObject, bundle: Bundle) => {
  const response = await z.request({
    url: 'https://httpbin.zapier-tooling.com/post',
    method: 'POST',
    body: {
      username: bundle.authData.username,
      password: bundle.authData.password,
    },
  });

  // If you're using core v9.x or older, you should call response.throwForStatus()
  // or verify response.status === 200 before you continue.
  return {
    // FIXME: The `|| "secret"` below is just for demo purposes, you should remove it.
    sessionKey: response.data.sessionKey || 'secret',
  };
};

// This function runs before every outbound request. You can have as many as you
// need. They'll need to each be registered in your index.js file.
const includeSessionKeyHeader = (request, z: ZObject, bundle: Bundle) => {
  if (bundle.authData.sessionKey) {
    request.headers = request.headers || {};
    request.headers['X-API-Key'] = bundle.authData.sessionKey;
  }

  return request;
};

export default {
  config: {
    // "session" auth exchanges user data for a different session token (that may be
    // periodically refreshed")
    type: 'session',
    sessionConfig: { perform: getSessionKey },

    // Define any input app's auth requires here. The user will be prompted to enter
    // this info when they connect their account.
    fields: [
      { key: 'username', label: 'Username', required: true },
      {
        key: 'password',
        label: 'Password',
        required: true,

        // this lets the user enter masked data
        type: 'password',
      },
    ],

    // The test method allows Zapier to verify that the credentials a user provides
    // are valid. We'll execute this method whenever a user connects their account for
    // the first time.
    test,

    // This template string can access all the data returned from the auth test. If
    // you return the test object, you'll access the returned data with a label like
    // `{{json.X}}`. If you return `response.data` from your test, then your label can
    // be `{{X}}`. This can also be a function that returns a label. That function has
    // the standard args `(z: ZObject, bundle: Bundle)` and data returned from the
    // test can be accessed in `bundle.inputData.X`.
    connectionLabel: '{{json.username}}',
  } satisfies Authentication,
  befores: [includeSessionKeyHeader],
  afters: [],
};
