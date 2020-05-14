const _ = require('lodash');

const recipe = require('./triggers/recipe');
const movie = require('./triggers/movie');

// HTTP before middleware that adds sorting query params.
// We want *every* request to our API to be sorted in reverse chronological order.
// Applying this middleware guarantees this.
const addSortingParams = (request /*, z */) => {
  request.params = _.extend({}, request.params, {
    _sort: 'id',
    _order: 'desc',
  });
  return request;
};

// HTTP after middleware that checks for errors in the response.
const handleErrors = (response, z) => {
  // Prevent `throwForStatus` from throwing for a certain status.
  if (response.status === 456) {
    response.skipThrowForStatus = true;
  }

  // Throw an error that `throwForStatus` wouldn't throw (correctly) for.
  else if (response.status === 200 && response.data.success === false) {
    throw new z.errors.Error(response.data.message, response.data.code);
  }

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
    addSortingParams,
  ],

  afterResponse: [
    // add our after middlewares
    handleErrors,
  ],

  resources: {},

  // If you want your trigger to show up, you better include it here!
  triggers: {
    [recipe.key]: recipe,
    [movie.key]: movie,
  },

  // If you want your searches to show up, you better include it here!
  searches: {},

  // If you want your creates to show up, you better include it here!
  creates: {},
};

// Finally, export the app.
module.exports = App;
