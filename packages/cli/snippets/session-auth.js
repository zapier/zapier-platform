const getSessionKey = async (z, bundle) => {
  const response = await z.request({
    method: 'POST',
    url: 'https://example.com/api/accounts/login.json',
    body: {
      username: bundle.authData.username,
      password: bundle.authData.password,
    },
  });

  // response.throwForStatus() if you're using core v9 or older

  return {
    sessionKey: response.data.sessionKey,
    // or response.json.sessionKey if you're using core v9 and older
  };
};

const authentication = {
  type: 'session',
  // "test" could also be a function
  test: {
    url: 'https://example.com/api/accounts/me.json',
  },
  fields: [
    {
      key: 'username',
      type: 'string',
      required: true,
      helpText: 'Your login username.',
    },
    {
      key: 'password',
      type: 'string',
      required: true,
      helpText: 'Your login password.',
    },
    // For Session Auth we store `sessionKey` automatically in `bundle.authData`
    // for future use. If you need to save/use something that the user shouldn't
    // need to type/choose, add a "computed" field, like:
    // {key: 'something': type: 'string', required: false, computed: true}
    // And remember to return it in sessionConfig.perform
  ],
  sessionConfig: {
    perform: getSessionKey,
  },
};

const includeSessionKeyHeader = (request, z, bundle) => {
  if (bundle.authData.sessionKey) {
    request.headers = request.headers || {};
    request.headers['X-Session-Key'] = bundle.authData.sessionKey;
  }
  return request;
};

const App = {
  // ...
  authentication: authentication,
  beforeRequest: [includeSessionKeyHeader],
  // ...
};
