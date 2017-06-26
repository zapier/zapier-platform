const species = require('./triggers/species');
const people = require('./triggers/people');

const App = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  beforeRequest: [
  ],

  afterResponse: [
  ],

  resources: {
  },

  triggers: {
    [species.key]: species,
    [people.key]: people
  },

  searches: {
  },

  creates: {
  }
};

// Finally, export the app.
module.exports = App;
