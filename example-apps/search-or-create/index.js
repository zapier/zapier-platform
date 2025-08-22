const RecipeCreate = require('./creates/recipe');
const RecipeSearch = require('./searches/recipe');

const addAuthHeader = (request, z, bundle) => {
  // Hard-coded auth header just for demo. DON'T do auth like this for your
  // production app!
  request.headers['X-Api-Key'] = 'secret';
  return request;
};

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  beforeRequest: [addAuthHeader],

  searches: { [RecipeSearch.key]: RecipeSearch },

  creates: { [RecipeCreate.key]: RecipeCreate },

  searchOrCreates: {
    [RecipeSearch.key]: {
      // The key must match the search
      key: RecipeSearch.key, // same as above
      type: 'searchOrCreate',
      display: {
        // The label shows up when the search-or-create checkbox is checked.
        // See https://cdn.zappy.app/5fc31d104c6bd0050c44510557b3b98f.png
        label: 'Find or Create a Recipe',
        description: 'x', // this is ignored
      },
      search: RecipeSearch.key,
      create: RecipeCreate.key,
    },
  },
};
