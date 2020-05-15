const _ = require('lodash');

const authentication = {
  type: 'oauth1',
  oauth1Config: {
    getRequestToken: {
      url: 'https://{{bundle.inputData.subdomain}}.example.com/request-token',
      method: 'POST',
      auth: {
        oauth_consumer_key: '{{process.env.CLIENT_ID}}',
        oauth_consumer_secret: '{{process.env.CLIENT_SECRET}}',

        // 'HMAC-SHA1' is used by default if not specified.
        // 'HMAC-SHA256', 'RSA-SHA1', 'PLAINTEXT' are also supported.
        oauth_signature_method: 'HMAC-SHA1',
        oauth_callback: '{{bundle.inputData.redirect_uri}}',
      },
    },
    authorizeUrl: {
      url: 'https://{{bundle.inputData.subdomain}}.example.com/authorize',
      params: {
        oauth_token: '{{bundle.inputData.oauth_token}}',
      },
    },
    getAccessToken: {
      url: 'https://{{bundle.inputData.subdomain}}.example.com/access-token',
      method: 'POST',
      auth: {
        oauth_consumer_key: '{{process.env.CLIENT_ID}}',
        oauth_consumer_secret: '{{process.env.CLIENT_SECRET}}',
        oauth_token: '{{bundle.inputData.oauth_token}}',
        oauth_token_secret: '{{bundle.inputData.oauth_token_secret}}',
        oauth_verifier: '{{bundle.inputData.oauth_verifier}}',
      },
    },
  },
  test: {
    url: 'https://{{bundle.authData.subdomain}}.example.com/me',
  },
  // If you need any fields upfront, put them here
  fields: [
    { key: 'subdomain', type: 'string', required: true, default: 'app' },
    // For OAuth1 we store `oauth_token` and `oauth_token_secret` automatically
    // in `bundle.authData` for future use. If you need to save/use something
    // that the user shouldn't need to type/choose, add a "computed" field, like:
    // {key: 'user_id': type: 'string', required: false, computed: true}
    // And remember to return it in oauth1Config.getAccessToken
  ],
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
      oauth_token_secret: bundle.authData.oauth_token_secret,
    });
  }
  return req;
};

const App = {
  // ...
  authentication: authentication,
  beforeRequest: [includeAccessToken],
  // ...
};

module.exports = App;
