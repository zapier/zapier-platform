/*
Welcome to the Zapier Basic Auth example app!
This app does a simple auth test to showcase how Zapier will automatically add the authorization header if your app
is configured to use HTTP Basic Auth.
*/

const authentication = require('./authentication');

const App = {
  // This is just shorthand to reference the installed dependencies you have. Zapier will
  // need to know these before we can upload
  version: require('./package.json').version,
  platformVersion: require('@zapier/zapier-platform-core').version,

  authentication: authentication,

  beforeRequest: [
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
