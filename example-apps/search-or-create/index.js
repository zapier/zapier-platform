const RecipeSearch = require('./searches/recipe');
const RecipeCreate = require('./creates/recipe');

const addAuthHeader = (request, z, bundle) => {
  // Hard-coded auth header just for demo
  request.headers['X-API-Key'] = 'secret';
  return request;
};

const App = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  // beforeRequest & afterResponse are optional hooks into the provided HTTP client
  beforeRequest: [ addAuthHeader ],
  afterResponse: [],

  // If you want your trigger to show up, you better include it here!
  triggers: {},

  // If you want your searches to show up, you better include it here!
  searches: { [RecipeSearch.key]: RecipeSearch },

  // If you want your creates to show up, you better include it here!
  creates: { [RecipeCreate.key]: RecipeCreate },

  searchOrCreates: {
    [RecipeSearch.key]: { // the key must match the search
      key: RecipeSearch.key, // same as above
      display: {
        // the label goes up in sidebar
        // see: https://cdn.zapier.com/storage/photos/04f7951bda0c43dc80eb630251724336.png
        label: 'Label Goes Here',
        description: 'this is the description.' // this is ignored
      },
      search: RecipeSearch.key,
      create: RecipeCreate.key
    }
  }
};

module.exports = App;
