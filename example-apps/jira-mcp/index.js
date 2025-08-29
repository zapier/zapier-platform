const jiraIssue = require('./triggers/jira-issue');

const App = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  // Simple authentication - in production would use OAuth or API keys
  authentication: {
    type: 'custom',
    test: {
      url: 'https://zapierorg.atlassian.net/rest/api/2/myself',
    },
    fields: [
      {
        key: 'apiToken',
        label: 'API Token',
        required: true,
        type: 'password',
        helpText: 'Your Jira API token for authentication',
      },
      {
        key: 'email',
        label: 'Email',
        required: true,
        type: 'string',
        helpText: 'Your Jira account email',
      },
    ],
  },

  triggers: {
    [jiraIssue.key]: jiraIssue,
  },

  searches: {},
  creates: {},
};

module.exports = App;
