import type { ZObject, Bundle, Authentication } from 'zapier-platform-core';

const querystring = require('querystring');

const REQUEST_TOKEN_URL = 'https://trello.com/1/OAuthGetRequestToken';
const ACCESS_TOKEN_URL = 'https://trello.com/1/OAuthGetAccessToken';
const AUTHORIZE_URL = 'https://trello.com/1/OAuthAuthorizeToken';

const getRequestToken = async (z: ZObject, bundle: Bundle) => {
  const response = await z.request({
    url: REQUEST_TOKEN_URL,
    method: 'POST',
    auth: {
      oauth_consumer_key: process.env.CLIENT_ID,
      oauth_consumer_secret: process.env.CLIENT_SECRET,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_callback: bundle.inputData.redirect_uri,

      // oauth_version: '1.0' // sometimes required
    },
  });
  return querystring.parse(response.content);
};

const getAccessToken = async (z: ZObject, bundle: Bundle) => {
  const response = await z.request({
    url: ACCESS_TOKEN_URL,
    method: 'POST',
    auth: {
      oauth_consumer_key: process.env.CLIENT_ID,
      oauth_consumer_secret: process.env.CLIENT_SECRET,
      oauth_token: bundle.inputData.oauth_token,
      oauth_token_secret: bundle.inputData.oauth_token_secret,
      oauth_verifier: bundle.inputData.oauth_verifier,
    },
  });
  return querystring.parse(response.content);
};

// This function runs before every outbound request. You can have as many as you
// need. They'll need to each be registered in your index.js file.
const includeAccessToken = (request, z: ZObject, bundle: Bundle) => {
  if (
    bundle.authData &&
    bundle.authData.oauth_token &&
    bundle.authData.oauth_token_secret
  ) {
    // Put your OAuth1 credentials in `req.auth`, Zapier will sign the request for
    // you.
    request.auth = {
      oauth_consumer_key: process.env.CLIENT_ID,
      oauth_consumer_secret: process.env.CLIENT_SECRET,
      oauth_token: bundle.authData.oauth_token,
      oauth_token_secret: bundle.authData.oauth_token_secret,

      // oauth_version: '1.0', // sometimes required
      ...(request.auth || {}),
    };
  }

  return request;
};

// You want to make a request to an endpoint that is either specifically designed
// to test auth, or one that every user will have access to. eg: `/me`.
// By returning the entire request object, you have access to the request and
// response data for testing purposes. Your connection label can access any data
// from the returned response using the `json.` prefix. eg: `{{json.username}}`.
const test = (z: ZObject, bundle: Bundle) =>
  z.request({ url: 'https://api.trello.com/1/members/me/' });

export default {
  config: {
    // OAuth1 is an older form of OAuth
    type: 'oauth1',
    oauth1Config: {
      // We have to define getRequestToken and getAccessToken functions to explicitly
      // parse the response like it has a form body here, since Trello responds
      // 'text/plain' for the Content-Type header
      getRequestToken,
      getAccessToken,
      authorizeUrl: {
        url: AUTHORIZE_URL,
        params: {
          oauth_token: '{{bundle.inputData.oauth_token}}',
          name: 'Zapier/Trello OAuth1 Test',
        },
      },
    },

    // Define any input app's auth requires here. The user will be prompted to enter
    // this info when they connect their account.
    fields: [],

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
    connectionLabel: '{{username}}',
  } satisfies Authentication,
  befores: [includeAccessToken],
  afters: [],
};
