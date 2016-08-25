/*
## Welcome to the Zapier example app!

This is a small example, all in one file. You can get a clone and start it
from `zapier init --template=minimal`. You can of course break apart your
example app, no reason to make it a single file. Also, we recommend taking
a look at the automated tests you can do via `zapier test`!
*/

const baseURL = 'http://57b20fb546b57d1100a3c405.mockapi.io/api';

// We recommend writing your triggers separate like this and rolling them
// into the App definition at the end.
const recipe = {
  key: 'recipe',

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: 'Recipe',
  display: {
    label: 'New Recipe',
    description: 'Trigger when a new recipe is added.'
  },

  // `operation` is where the business logic goes.
  operation: {

    // `inputFields` can define the fields a user could provide,
    // we'll pass them in as `bundle.inputData` later.
    inputFields: [
      {key: 'style', type: 'string'}
    ],

    perform: (z, bundle) => {
      // `z.console.log()` is similar to `console.log()`.
      z.console.log('console says hello world!');

      // You can build requests and our client will helpfully inject all the variables
      // you need to complete. You can also register middleware to control this.
      const promise = z.request({
        url: `${baseURL}/recipes`,
        params: {
          style: bundle.inputData.style
        }
      });

      // You may return a promise or a normal data structure from any perform method.
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
    [recipe.key]: recipe
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
