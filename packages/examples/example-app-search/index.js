/*
## Welcome to the Zapier search example app!

This is a small example, all in one file. You can get a clone and start it
from `zapier init --template=search`. You can of course break apart your
example app, no reason to make it a single file. Also, we recommend taking
a look at the automated tests you can do via `zapier test`!
*/

const baseURL = 'http://57b20fb546b57d1100a3c405.mockapi.io/api';

const searchRecipes = {
  key: 'search_recipes',

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: 'Recipe',
  display: {
    label: 'Search Recipes',
    description: 'Search for recipes.'
  },

  // `operation` is where we make the call to your API to do the search
  operation: {
    // This search only has one search field. Your searches might have just one, or many
    // search fields.
    inputFields: [
      {
        key: 'style',
        type: 'string',
        label: 'Style',
        helpText: 'Recipe style - mediterranean, italian, etc'
      }
    ],

    perform: (z, bundle) => {
      const url = `${baseURL}/recipes`;

      // Put the search value in a query param. The details of how to build
      // a search URL will depend on how your API works.
      const options = {
        params: {
          search: bundle.inputData.style
        }
      };

      return z.request(url, options)
        .then(response => JSON.parse(response.content));
    }
  }
};

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

  resources: {

  },

  // If you want your trigger to show up, you better include it here!
  triggers: {

  },

  // If you want your searches to show up, you better include it here!
  searches: {
    [searchRecipes.key]: searchRecipes
  },

  // If you want your writes to show up, you better include it here!
  writes: {

  }
};

// Finally, export the app.
module.exports = App;
