const Recipe = require('./resources/recipe');

const addAuthHeader = (request, z, bundle) => {
  // Hard-coded authentication just for demo
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

  // If you want your resource to show up, you better include it here!
  resources: {
    [Recipe.key]: Recipe
  },

  // If you want your trigger to show up, you better include it here!
  triggers: {},

  // If you want your searches to show up, you better include it here!
  searches: {},

  // If you want your creates to show up, you better include it here!
  creates: {}
};

// Finally, export the app.
module.exports = App;
