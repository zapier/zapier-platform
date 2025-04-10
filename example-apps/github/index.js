const repoTrigger = require('./triggers/repo');
const issueCreate = require('./creates/issue');
const issueTrigger = require('./triggers/issue');
const issueClosed = require('./triggers/issue_closed');
const {
  config: authentication,
  befores = [],
  afters = [],
} = require('./authentication');

const App = {
  // This is just shorthand to reference the installed dependencies you have. Zapier will
  // need to know these before we can upload
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
  authentication,

  // beforeRequest & afterResponse are optional hooks into the provided HTTP client
  beforeRequest: [...befores],

  afterResponse: [...afters],

  // If you want to define optional resources to simplify creation of triggers, searches, creates - do that here!
  resources: {},

  // If you want your trigger to show up, you better include it here!
  triggers: {
    [repoTrigger.key]: repoTrigger,
    [issueTrigger.key]: issueTrigger,
    [issueClosed.key]: issueClosed,
  },

  // If you want your searches to show up, you better include it here!
  searches: {},

  // If you want your creates to show up, you better include it here!
  creates: {
    [issueCreate.key]: issueCreate,
  },
};

// Finally, export the app.
module.exports = App;
