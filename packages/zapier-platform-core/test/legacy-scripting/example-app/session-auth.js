'use strict';

const testAuthSource = `
  const responsePromise = z.request({
    url: 'https://auth-json-server.zapier.ninja/me'
  });
  return responsePromise.then(response => {
    if (response.status !== 200) {
      throw new Error('Auth failed');
    }
    return z.JSON.parse(response.content);
  });
`;

const getSessionKeySource = `
  return z.legacyScripting.run(bundle, 'auth.session');
`;

const maybeIncludeAuthSource = `
  if (bundle.authData.sessionKey) {
    request.headers['X-API-Key'] = bundle.authData.sessionKey;
  }
  return request;
`;

const maybeRefreshAuthSource = `
  if (response.status === 401) {
    throw new z.errors.RefreshAuthError('Session key needs refreshing');
  }
  return response;
`;

module.exports = {
  authentication: {
    type: 'session',
    test: { source: testAuthSource },
    fields: [
      {
        key: 'username',
        label: 'Username',
        type: 'string',
        required: true
      },
      {
        key: 'password',
        label: 'Password',
        type: 'password',
        required: true
      }
    ],
    sessionConfig: {
      perform: { source: getSessionKeySource }
    }
  },
  beforeRequest: [{ source: maybeIncludeAuthSource }],
  afterResponse: [{ source: maybeRefreshAuthSource }]
};
