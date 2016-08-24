/*
## Welcome to the Zapier example app!

This is a small example, all in one file. You can get a clone and start it
from `zapier init --template=minimal`. You can of course break apart your
example app, no reason to make it a single file. Also, we recommend taking
a look at the automated tests you can do via `zapier test`!
*/

const _ = require('lodash');
const baseURL = 'http://57b20fb546b57d1100a3c405.mockapi.io/api';

// New recipe trigger
const newRecipe = {
  key: 'new-recipe',

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: 'Recipe',
  display: {
    label: 'New Recipe',
    description: 'Trigger when a new recipe is added.'
  },

  // `operation` is where we make the call to your API
  operation: {
    perform: {
      url: `${baseURL}/recipes`
    }
  }
};

// New movie trigger
const newMovie = {
  key: 'new-movie',

  noun: 'Movie',
  display: {
    label: 'New Movie',
    description: 'Trigger when a new movie is added.'
  },

  operation: {
    perform: { url: `${baseURL}/movies` }
  }
};

// HTTP before middleware that adds sorting query params.
// We want *every* request to our API to be sorted in reverse chronological order.
// Applying this middleware guarantees this.
const addSortingParams = (request) => {
  request.params = _.extend({}, request.params, {
    sortBy: 'createdAt',
    order: 'desc'
  });
  return request;
};

// HTTP after middleware that checks for errors in the response.
const checkForErrors = (response, z) => {
  // If we get a bad status code, throw an error. This will halt the zap.
  if (response.status >= 300) {
    throw new z.errors.HaltedError(`Unexpected status code ${response.status} from ${response.request.url}`);
  }

  // If no errors just return original response
  return response;
};

// Now we can roll up all our behaviors in an App.
const App = {
  // This is just shorthand to reference the installed dependencies you have. Zapier will
  // need to know these before we can upload
  version: require('./package.json').version,
  platformVersion: require('./package.json').dependencies['@zapier/zapier-platform-core'],

  beforeRequest: [
    // add our before middlewares
    addSortingParams
  ],

  afterResponse: [
    // add our after middlewares
    checkForErrors
  ],

  resources: {

  },

  // If you want your trigger to show up, you better include it here!
  triggers: {
    [newRecipe.key]: newRecipe,
    [newMovie.key]: newMovie
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
