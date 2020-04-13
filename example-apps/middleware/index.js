const _ = require('lodash');

const recipe = require('./triggers/recipe');
const movie = require('./triggers/movie');

// HTTP before middleware that adds sorting query params.
// We want *every* request to our API to be sorted in reverse chronological order.
// Applying this middleware guarantees this.
const addSortingParams = (request /*, z */) => {
  request.params = _.extend({}, request.params, {
    _sort: 'id',
    _order: 'desc'
  });
  return request;
};

// HTTP after middleware that checks for errors in the response.
// When you don't use `afterResponse` it default to `[throwForStatus]`.
const handleErrors = (response, z) => {
  // Throw an error that `throwForStatus` wouldn't throw (correctly) for.
  if (response.status === 206) {
    throw new z.errors.Error(
      `Received incomplete data: ${response.json.error_message}`,
      response.json.error_code,
      response.status
    );
  }

  // Prevent `throwForStatus` from throwing for a certain status.
  if (response.status === 404) {
    return response;
  }

  // When you define an `afterResponse`, make sure one of them handles error responses.
  // Call `throwForStatus` after handling cases that it doesn't or shouldn't throw for.
  response.throwForStatus();

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
    handleErrors
  ],

  resources: {},

  // If you want your trigger to show up, you better include it here!
  triggers: {
    [recipe.key]: recipe,
    [movie.key]: movie
  },

  // If you want your searches to show up, you better include it here!
  searches: {},

  // If you want your creates to show up, you better include it here!
  creates: {}
};

// Finally, export the app.
module.exports = App;
