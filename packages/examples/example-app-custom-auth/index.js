/*
Welcome to the Zapier Custom Auth example app!
This app showcases how to setup a custom authentication scheme.
It also illustrates how to add the required auth details to later requests.
*/

const authentication = require('./authentication');

// To include the API key header on all outbound requests, simply define a function here.
// It runs runs before each request is sent out, allowing you to make tweaks to the request in a centralized spot
const includeApiKeyHeader = (request, z, bundle) => {
  if (bundle.authData.apiKey) {
    request.params = request.params || {};
    request.params.api_key = bundle.authData.apiKey;
  }
  return request;
};

const App = {
  // This is just shorthand to reference the installed dependencies you have. Zapier will
  // need to know these before we can upload
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  authentication: authentication,

  beforeRequest: [
    includeApiKeyHeader
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

  // If you want your creates to show up, you better include it here!
  creates: {
  }
};

// Finally, export the app.
module.exports = App;
