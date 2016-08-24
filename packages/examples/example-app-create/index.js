/*
Welcome to the Zapier Write example app!
This is a small example, all in one file. You can get a clone and start it
from `zapier init --template=write`. You can of course break apart your
example app, no reason to make it a single file. Also, we recommend taking
a look at the automated tests you can do via `zapier test`!
*/

const baseURL = 'http://57b20fb546b57d1100a3c405.mockapi.io/api';

// We recommend writing your writes separate like this and rolling them
// into the App definition at the end.
const recipe = {
  key: 'recipe',

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: 'Recipe',
  display: {
    label: 'Create Recipe',
    description: 'Creates a new recipe.'
  },

  // `operation` is where the business logic goes.
  operation: {
    inputFields: [
      {key: 'name', required: true, type: 'string'},
      {key: 'directions', required: true, type: 'text'},
      {key: 'authorId', required: true, type: 'integer'}
    ],
    perform: (z, bundle) => {
      const promise = z.request({
        url: `${baseURL}/recipes`,
        method: 'POST',
        body: JSON.stringify({
          name: bundle.inputData.name,
          directions: bundle.inputData.directions,
          authorId: bundle.inputData.authorId,
        }),
        headers: {
          'content-type': 'application/json'
        }
      });

      return promise.then((response) => JSON.parse(response.content));
    }
  }
};

// Now we can roll up all our behaviors in an App.
const App = {
  // This is just shorthand to reference the installed dependencies you have. Zapier will
  // need to know these before we can upload
  version: require('./package.json').version,
  platformVersion: require('./package.json').dependencies['@zapier/zapier-platform-core'],

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

  },

  // If you want your writes to show up, you better include it here!
  writes: {
    [recipe.key]: recipe
  }
};

// Finally, export the app.
module.exports = App;
