const species = require("./triggers/species");
const people = require("./triggers/people");

const App = {
  version: require("./package.json").version,
  platformVersion: require("zapier-platform-core").version,

  beforeRequest: [],

  afterResponse: [],

  resources: {},

  triggers: {
    [species.key]: species,
    [people.key]: people
  },

  searches: {},

  creates: {},

  authentication: {
    type: "custom",
    // "test" could also be a function
    test: () => true,
    fields: [
      {
        key: "favorite_color",
        type: "string",
        required: false
      }
    ]
  }
};

// Finally, export the app.
module.exports = App;
