const hydrators = require('./hydrators');
const newFile = require('./triggers/newFile');
const uploadFile = require('./creates/uploadFile');

// We can roll up all our behaviors in an App.
const App = {
  // This is just shorthand to reference the installed dependencies you have. Zapier will
  // need to know these before we can upload
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  // beforeRequest & afterResponse are optional hooks into the provided HTTP client
  beforeRequest: [
  ],

  afterResponse: [
  ],

  // Any hydrators go here
  hydrators: hydrators,

  // If you want to define optional resources to simplify creation of triggers, searches, creates - do that here!
  resources: {
  },

  // If you want your triggers to show up, you better include it here!
  triggers: {
    [newFile.key]: newFile,
  },

  // If you want your searches to show up, you better include it here!
  searches: {
  },

  // If you want your creates to show up, you better include it here!
  creates: {
    [uploadFile.key]: uploadFile,
  }
};

// Finally, export the app.
module.exports = App;
