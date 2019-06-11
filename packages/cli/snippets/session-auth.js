const getSessionKey = (z, bundle) => {
  const promise = z.request({
    method: 'POST',
    url: 'https://example.com/api/accounts/login.json',
    body: {
      username: bundle.authData.username,
      password: bundle.authData.password
    }
  });

  return promise.then(response => {
    if (response.status === 401) {
      throw new Error('The username/password you supplied is invalid');
    }
    return {
      sessionKey: z.JSON.parse(response.content).sessionKey
    };
  });
};

const authentication = {
  type: 'session',
  // "test" could also be a function
  test: {
    url: 'https://example.com/api/accounts/me.json'
  },
  fields: [
    {
      key: 'username',
      type: 'string',
      required: true,
      helpText: 'Your login username.'
    },
    {
      key: 'password',
      type: 'string',
      required: true,
      helpText: 'Your login password.'
    }
    // For Session Auth we store `sessionKey` automatically in `bundle.authData`
    // for future use. If you need to save/use something that the user shouldn't
    // need to type/choose, add a "computed" field, like:
    // {key: 'something': type: 'string', required: false, computed: true}
    // And remember to return it in sessionConfig.perform
  ],
  sessionConfig: {
    perform: getSessionKey
  }
};

const includeSessionKeyHeader = (request, z, bundle) => {
  if (bundle.authData.sessionKey) {
    request.headers = request.headers || {};
    request.headers['X-Session-Key'] = bundle.authData.sessionKey;
  }
  return request;
};

const sessionRefreshIf401 = (response, z, bundle) => {
  if (bundle.authData.sessionKey) {
    if (response.status === 401) {
      throw new z.errors.RefreshAuthError(); // ask for a refresh & retry
    }
  }
  return response;
};

const App = {
  // ...
  authentication: authentication,
  beforeRequest: [includeSessionKeyHeader],
  afterResponse: [sessionRefreshIf401]
  // ...
};
