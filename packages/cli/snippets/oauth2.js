const authentication = {
  type: 'oauth2',
  test: {
    url:
      'https://{{bundle.authData.subdomain}}.example.com/api/accounts/me.json',
  },
  // you can provide additional fields for inclusion in authData
  oauth2Config: {
    // "authorizeUrl" could also be a function returning a string url
    authorizeUrl: {
      method: 'GET',
      url:
        'https://{{bundle.inputData.subdomain}}.example.com/api/oauth2/authorize',
      params: {
        client_id: '{{process.env.CLIENT_ID}}',
        state: '{{bundle.inputData.state}}',
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
        response_type: 'code',
      },
    },
    // Zapier expects a response providing {access_token: 'abcd'}
    // "getAccessToken" could also be a function returning an object
    getAccessToken: {
      method: 'POST',
      url:
        'https://{{bundle.inputData.subdomain}}.example.com/api/v2/oauth2/token',
      body: {
        code: '{{bundle.inputData.code}}',
        client_id: '{{process.env.CLIENT_ID}}',
        client_secret: '{{process.env.CLIENT_SECRET}}',
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
        grant_type: 'authorization_code',
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
    scope: 'read,write',
  },
  // If you need any fields upfront, put them here
  fields: [
    { key: 'subdomain', type: 'string', required: true, default: 'app' },
    // For OAuth2 we store `access_token` and `refresh_token` automatically
    // in `bundle.authData` for future use. If you need to save/use something
    // that the user shouldn't need to type/choose, add a "computed" field, like:
    // {key: 'user_id': type: 'string', required: false, computed: true}
    // And remember to return it in oauth2Config.getAccessToken/refreshAccessToken
  ],
};

const addBearerHeader = (request, z, bundle) => {
  if (bundle.authData && bundle.authData.access_token) {
    request.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
  }
  return request;
};

const App = {
  // ...
  authentication: authentication,
  beforeRequest: [addBearerHeader],
  // ...
};

module.exports = App;
