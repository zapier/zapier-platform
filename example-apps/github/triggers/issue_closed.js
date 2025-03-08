const sample = require('../samples/sample_issue');

// Function that will be called when the Zap triggers
const triggerIssueClose = (z, bundle) => {
  // When using webhooks, this function handles the data after it's been filtered
  return [bundle.cleanedRequest.issue];
};

module.exports = {
  key: 'issue_closed',
  noun: 'Issue',

  display: {
    label: 'Issue Closed',
    description: 'Triggers when a GitHub issue is closed.',
    important: true
  },

  operation: {
    inputFields: [
      {
        key: 'repo',
        label: 'Repository',
        required: true,
        dynamic: 'repo.full_name.full_name',
        helpText: 'Select the GitHub repository to watch for closed issues.'
      }
    ],
    
    type: 'hook',
    
    performSubscribe: (z, bundle) => {
      // Create a webhook subscription
      const data = {
        name: 'zapier',
        events: ['issues'],
        active: true,
        config: {
          url: bundle.targetUrl,
          content_type: 'json'
        }
      };
      
      return z.request({
        method: 'POST',
        url: `https://api.github.com/repos/${bundle.inputData.repo}/hooks`,
        body: data
      }).then(response => response.data);
    },
    
    performUnsubscribe: (z, bundle) => {
      // Remove the webhook subscription
      return z.request({
        method: 'DELETE',
        url: `https://api.github.com/repos/${bundle.inputData.repo}/hooks/${bundle.subscribeData.id}`
      });
    },
    
    perform: (z, bundle) => {
      // Only return data if this is an issue closing event
      if (bundle.cleanedRequest && 
          bundle.cleanedRequest.action === 'closed' && 
          bundle.cleanedRequest.issue) {
        return [bundle.cleanedRequest.issue];
      }
      return [];
    },
    
    // For testing in the Zapier UI
    performList: (z, bundle) => {
      return z.request({
        method: 'GET',
        url: `https://api.github.com/repos/${bundle.inputData.repo}/issues`,
        params: {
          state: 'closed',
          sort: 'updated',
          direction: 'desc',
          per_page: 5
        }
      }).then(response => response.data);
    },
    
    sample: sample
  }
};