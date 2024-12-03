const recipe = require('./triggers/recipe');

const addAuthHeader = (request, z, bundle) => {
  // Hard-coded auth header just for demo
  request.headers['X-API-Key'] = 'secret';
  return request;
};

// Now we can roll up all our behaviors in an App.
const App = {
  // This is just shorthand to reference the installed dependencies you have. Zapier will
  // need to know these before we can upload
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  beforeRequest: [addAuthHeader],

  afterResponse: [],

  resources: {},

  // If you want your trigger to show up, you better include it here!
  triggers: {
    [recipe.key]: recipe
  },

  // If you want your searches to show up, you better include it here!
  searches: {},

  // If you want your creates to show up, you better include it here!
  creates: {}
};

// Finally, export the app.
module.exports = App;
