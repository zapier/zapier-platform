/*
Welcome to the Zapier OAuth2 example app!
This app showcases the necessary methods needed to perform the OAuth2 flow.
It also illustrates how to add the authorization header to later requests.
*/

process.env.BASE_URL = process.env.BASE_URL || 'http://zapier.webscript.io/platform-example-app';

const authentication = require('./authentication');

// To include the Authorization header on all outbound requests, simply define a function here.
// It runs runs before each request is sent out, allowing you to make tweaks to the request in a centralized spot
const includeBearerToken = (request, z, bundle) => {
  if (bundle.authData.access_token) {
    request.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
  }
  return request;
};

const App = {
  // This is just shorthand to reference the installed dependencies you have. Zapier will
  // need to know these before we can upload
  version: require('./package.json').version,
  platformVersion: require('@zapier/zapier-platform-core').version,

  authentication: authentication,

  beforeRequest: [
    includeBearerToken
  ],

  afterResponse: [
  ],

  resources: {
  },

  // If you want your trigger to show up, you better include it here!
  triggers: {
  },

  // If you want your searches to show up, you better include it here!
  searches: {
  },

  // If you want your writes to show up, you better include it here!
  writes: {
  }
};

// Finally, export the app.
module.exports = App;
