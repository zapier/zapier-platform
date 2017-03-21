const _ = require('lodash');

const recipe = require('./triggers/recipe');
const movie = require('./triggers/movie');

// HTTP before middleware that adds sorting query params.
// We want *every* request to our API to be sorted in reverse chronological order.
// Applying this middleware guarantees this.
const addSortingParams = (request /*, z*/) => {
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
  platformVersion: require('zapier-platform-core').version,

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
    [recipe.key]: recipe,
    [movie.key]: movie
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
