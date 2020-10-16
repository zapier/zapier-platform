const prediction = require('./creates/prediction');

// Now we can roll up all our behaviors in an App.
const App = {
  // This is just shorthand to reference the installed dependencies you have. Zapier will
  // need to know these before we can upload
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  // If you want your creates to show up, you better include it here!
  creates: {
    [prediction.key]: prediction,
  },
};

// Finally, export the app.
module.exports = App;
