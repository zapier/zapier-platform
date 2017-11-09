const RepoTrigger = require('./triggers/repo');
const IssueCreate = require('./creates/issue');
const IssueTrigger = require('./triggers/issue');
const Authentication = require('./authentication');

const App = {
  // This is just shorthand to reference the installed dependencies you have. Zapier will
  // need to know these before we can upload
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
  authentication: Authentication,

  // beforeRequest & afterResponse are optional hooks into the provided HTTP client
  beforeRequest: [
  ],

  afterResponse: [
  ],

  // If you want to define optional resources to simplify creation of triggers, searches, creates - do that here!
  resources: {
  },

  // If you want your trigger to show up, you better include it here!
  triggers: {
    [RepoTrigger.key]: RepoTrigger,
    [IssueTrigger.key]: IssueTrigger,
  },

  // If you want your searches to show up, you better include it here!
  searches: {
  },

  // If you want your creates to show up, you better include it here!
  creates: {
    [IssueCreate.key]: IssueCreate,
  }
};

// Finally, export the app.
module.exports = App;
