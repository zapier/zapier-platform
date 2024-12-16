'use strict';

const baseOauthUrl = 'https://login.microsoftonline.com/common/oauth2';
// To get your OAuth2 redirect URI, run `zapier describe` and update this variable.
// Will looke like 'https://zapier.com/dashboard/auth/oauth/return/App123CLIAPI/'
const redirectUri = '';

const getAuthorizeURL = (z, bundle) => {
  let url = `${baseOauthUrl}/v2.0/authorize`;

  const urlParts = [
    `client_id=${process.env.CLIENT_ID}`,
    `redirect_uri=${encodeURIComponent(bundle.inputData.redirect_uri)}`,
    'response_type=code',
  ];

  if (bundle.inputData.accountType === 'business') {
    url = `${baseOauthUrl}/authorize`;
  } else {
    urlParts.push(`state=${bundle.inputData.state}`);
  }

  const finalUrl = `${url}?${urlParts.join('&')}`;

  return finalUrl;
};

const getAccessToken = (z, bundle) => {
  let url = `${baseOauthUrl}/v2.0/token`;

  const body = {
    code: bundle.inputData.code,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    grant_type: 'authorization_code',
  };

  if (bundle.inputData.accountType === 'business') {
    url = `${baseOauthUrl}/token`;
    body.redirect_uri = redirectUri;
    body.resource = 'https://graph.microsoft.com/';
  }

  const promise = z.request(url, {
    method: 'POST',
    body,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  });

  return promise.then((response) => ({
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token,
    id_token: response.data.id_token,
  }));
};

const refreshAccessToken = (z, bundle) => {
  let url = `${baseOauthUrl}/v2.0/token`;

  const body = {
    refresh_token: bundle.authData.refresh_token,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    grant_type: 'refresh_token',
  };

  if (bundle.authData.accountType === 'business') {
    url = `${baseOauthUrl}/token`;
    body.redirect_uri = redirectUri;
    body.resource = 'https://graph.microsoft.com/';
  }

  const promise = z.request(url, {
    method: 'POST',
    body,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  });

  return promise.then((response) => ({
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token,
    id_token: response.data.id_token,
  }));
};

// The test call Zapier makes to ensure an access token is valid
// UX TIP: Hit an endpoint that always returns data with valid credentials,
// like a /profile or /me endpoint. That way the success/failure is related to
// the token and not because the user didn't happen to have a recently created record.
const testAuth = (z) => {
  const promise = z.request({
    url: 'https://graph.microsoft.com/v1.0/me',
  });

  return promise.then((response) => response.data);
};

module.exports = {
  type: 'oauth2',
  connectionLabel: '{{bundle.inputData.userPrincipalName}}',
  oauth2Config: {
    authorizeUrl: getAuthorizeURL,
    getAccessToken,
    refreshAccessToken,
    // Set so Zapier automatically checks for 401s and calls refreshAccessToken
    autoRefresh: true,
    // offline_access is necessary for the refresh_token
    scope: 'User.Read Files.ReadWrite.All offline_access',
  },
  test: testAuth,
  fields: [
    {
      key: 'accountType',
      label: 'Account Type',
      choices: {
        personal: 'Personal - live.com/outlook.com',
        business: 'Business - Work or School',
      },
      default: 'personal',
      required: true,
    },
  ],
};
