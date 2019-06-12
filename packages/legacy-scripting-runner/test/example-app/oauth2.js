const { AUTH_JSON_SERVER_URL } = require('../auth-json-server');

const testAuthSource = `
  const responsePromise = z.request({
    url: '${AUTH_JSON_SERVER_URL}/me'
  });
  return responsePromise.then(response => {
    if (response.status !== 200) {
      throw new Error('Auth failed');
    }
    return z.JSON.parse(response.content);
  });
`;

const getAccessTokenSource = `
  return z.legacyScripting.run(bundle, 'auth.oauth2.token');
`;

const refreshAccessTokenSource = `
  return z.legacyScripting.run(bundle, 'auth.oauth2.refresh');
`;

const beforeRequestSource = `
  return z.legacyScripting.beforeRequest(request, z, bundle);
`;

module.exports = {
  legacy: {
    authentication: {
      placement: 'header',
      mapping: {}
    }
  },
  authentication: {
    type: 'oauth2',
    test: { source: testAuthSource },
    fields: [
      // No need to define access_token and refresh_token here, they will be
      // added automatically by the backend
      {
        key: 'something_custom',
        type: 'string',
        required: true,
        computed: true
      }
    ],
    oauth2Config: {
      authorizeUrl: {
        method: 'GET',
        url: `${AUTH_JSON_SERVER_URL}/oauth/authorize`,
        params: {
          client_id: '{{process.env.CLIENT_ID}}',
          state: '{{bundle.inputData.state}}',
          redirect_uri: '{{bundle.inputData.redirect_uri}}',
          response_type: 'code'
        }
      },
      getAccessToken: {
        source: getAccessTokenSource
      },
      refreshAccessToken: {
        source: refreshAccessTokenSource
      },
      autoRefresh: true
    }
  },
  beforeRequest: [
    { source: beforeRequestSource, args: ['request', 'z', 'bundle'] }
  ]

  // We don't need afterResponse to refresh auth as core appends one
  // automatically when autoRefresh is true
};
