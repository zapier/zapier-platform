const getAccessToken = async (z, bundle) => {
  const response = await z.request(
    `https://auth-json-server.zapier-staging.com/oauth/access-token`,
    {
      method: 'POST',
      body: {
        // extra data pulled from the users query string
        accountDomain: bundle.cleanedRequest.querystring.accountDomain,
        code: bundle.inputData.code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'authorization_code'
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      }
    }
  );

  // Needs to return `access_token`.
  // If your app does an app refresh, then `refresh_token` should be returned as well
  if (response.status !== 200) {
    throw new z.error.Error(
      'Unable to fetch access token: ' + response.content,
      'GetAccessTokenError',
      response.status
    );
  }

  return {
    access_token: response.json.access_token,
    refresh_token: response.json.refresh_token
  };
};

const refreshAccessToken = async (z, bundle) => {
  const response = await z.request(
    `https://auth-json-server.zapier-staging.com/oauth/refresh-token`,
    {
      method: 'POST',
      body: {
        refresh_token: bundle.authData.refresh_token,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'refresh_token'
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      }
    }
  );

  // This function should return `access_token`.
  // If the refresh token stays constant, no need to return it
  // If the refresh token changes, return it here to update the stored value in Zapier
  if (response.status !== 200) {
    throw new z.errors.Error(
      'Unable to fetch access token: ' + response.content,
      'RefreshAccessTokenError',
      response.status
    );
  }

  return {
    access_token: response.json.access_token
  };
};

// To include the Authorization header on all outbound requests, register this function as middleware
// It runs runs before each request is sent out, allowing you to make tweaks to the request in a centralized spot
const includeBearerToken = (request, z, bundle) => {
  if (bundle.authData.access_token) {
    request.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
  }
  return request;
};

const testAuth = async (z /*, bundle */) => {
  // Normally you want to make a request to an endpoint that is either specifically designed to test auth, or one that
  // every user will have access to, such as an account or profile endpoint like /me.
  const response = await z.request({
    method: 'GET',
    url: `https://auth-json-server.zapier-staging.com/me`
  });

  if (response.status === 401) {
    // This message is surfaced to the user
    throw new z.errors.Error(
      'The access token you supplied is not valid',
      'AuthenticationError',
      response.status
    );
  }

  // This method can return any truthy value to indicate the credentials are valid.
  return response;
};

module.exports = {
  config: {
    type: 'oauth2',
    oauth2Config: {
      // Step 1 of the OAuth flow; specify where to send the user to authenticate with your API.
      // Zapier generates the state and redirect_uri, you are responsible for providing the rest.
      // Note: can also be a function that returns a string
      authorizeUrl: {
        url: `https://auth-json-server.zapier-staging.com/oauth/authorize`,
        params: {
          client_id: '{{process.env.CLIENT_ID}}',
          state: '{{bundle.inputData.state}}',
          redirect_uri: '{{bundle.inputData.redirect_uri}}',
          response_type: 'code'
        }
      },
      // Step 2 of the OAuth flow; Exchange a code for an access token.
      // This could also use the request shorthand.
      getAccessToken: getAccessToken,
      // (Optional) If the access token expires after a pre-defined amount of time, you can implement
      // this method to tell Zapier how to refresh it.
      refreshAccessToken: refreshAccessToken,
      // If you want Zapier to automatically invoke `refreshAccessToken` on a 401 response, set to true
      autoRefresh: true
      // If there is a specific scope you want to limit your Zapier app to, you can define it here.
      // Will get passed along to the authorizeUrl
      // scope: 'read,write'
    },
    // The test method allows Zapier to verify that the access token is valid. We'll execute this
    // method after the OAuth flow is complete to ensure everything is setup properly.
    test: testAuth,
    // assuming "username" is a key returned from the test
    connectionLabel: '{{username}}'
  },
  befores: [includeBearerToken]
};
