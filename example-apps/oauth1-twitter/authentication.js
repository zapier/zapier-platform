const _ = require('lodash');

const REQUEST_TOKEN_URL = 'https://api.twitter.com/oauth/request_token';
const AUTHORIZE_URL = 'https://api.twitter.com/oauth/authorize';
const ACCESS_TOKEN_URL = 'https://api.twitter.com/oauth/access_token';

const config = {
  type: 'oauth1',
  oauth1Config: {
    getRequestToken: {
      url: REQUEST_TOKEN_URL,
      method: 'POST',
      auth: {
        oauth_consumer_key: '{{process.env.CLIENT_ID}}',
        oauth_consumer_secret: '{{process.env.CLIENT_SECRET}}',
        oauth_signature_method: 'HMAC-SHA1',
        oauth_callback: '{{bundle.inputData.redirect_uri}}',
        oauth_version: '1.0'  // must be 1.0 for Twitter
      }
    },
    authorizeUrl: {
      url: AUTHORIZE_URL,
      params: {
        oauth_token: '{{bundle.inputData.oauth_token}}'
      }
    },
    getAccessToken: {
      url: ACCESS_TOKEN_URL,
      method: 'POST',
      auth: {
        oauth_consumer_key: '{{process.env.CLIENT_ID}}',
        oauth_consumer_secret: '{{process.env.CLIENT_SECRET}}',
        oauth_token: '{{bundle.inputData.oauth_token}}',
        oauth_token_secret: '{{bundle.inputData.oauth_token_secret}}',
        oauth_verifier: '{{bundle.inputData.oauth_verifier}}'
      }
    }
  },
  test: {
    url: 'https://api.twitter.com/1.1/account/settings.json'
  },
  connectionLabel: '{{screen_name}}'
};

// A middleware that is run before z.request() actually makes the request. Here we're
// adding necessary OAuth1 parameters to `auth` property of the request object.
const includeAccessToken = (req, z, bundle) => {
  if (
    bundle.authData &&
    bundle.authData.oauth_token &&
    bundle.authData.oauth_token_secret
  ) {
    // Just put your OAuth1 credentials in req.auth, Zapier will sign the request for
    // you.
    req.auth = req.auth || {};
    _.defaults(req.auth, {
      oauth_consumer_key: process.env.CLIENT_ID,
      oauth_consumer_secret: process.env.CLIENT_SECRET,
      oauth_token: bundle.authData.oauth_token,
      oauth_token_secret: bundle.authData.oauth_token_secret
    });
  }
  return req;
};

module.exports = {
  config,
  includeAccessToken
};
