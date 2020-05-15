const App = {
  // both version strings are required
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  // see "Authentication" section below
  authentication: {},

  // see "Dehydration" section below
  hydrators: {},

  // see "Making HTTP Requests" section below
  requestTemplate: {},
  beforeRequest: [],
  afterResponse: [],

  // See "Resources" section below
  resources: {},

  // See "Triggers/Searches/Creates" section below
  triggers: {},
  searches: {},
  creates: {},
};

module.exports = App;
