/*
Welcome to the Zapier Resource example app!
*/

process.env.BASE_URL = process.env.BASE_URL || 'http://57b20fb546b57d1100a3c405.mockapi.io/api';

const Recipe = require('./resources/recipe');

// Now we can roll up all our behaviors in an App.
const App = {
  // This is just shorthand to reference the installed dependencies you have. Zapier will
  // need to know these before we can upload
  version: require('./package.json').version,
  platformVersion: require('@zapier/zapier-platform-core').version,

  beforeRequest: [
  ],

  afterResponse: [
  ],

  // If you want your resource to show up, you better include it here!
  resources: {
    [Recipe.key]: Recipe,
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
