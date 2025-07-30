import type { ZObject, Bundle, Authentication } from 'zapier-platform-core';

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

export const befores = [includeAccessToken];

export const afters = [];
