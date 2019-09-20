const sample = require('../samples/sample_issue');

const createIssue = (z, bundle) => {
  const responsePromise = z.request({
    method: 'POST',
    url: `https://api.github.com/repos/${bundle.inputData.repo}/issues`,
    body: {
      title: bundle.inputData.title,
      body: bundle.inputData.body
    }
  });
  return responsePromise.then(response => JSON.parse(response.content));
};

module.exports = {
  key: 'issue',
  noun: 'Issue',

  display: {
    label: 'Create Issue',
    description: 'Creates a issue.'
  },

  operation: {
    inputFields: [
      {
        key: 'repo',
        label: 'Repo',
        required: true,
        dynamic: 'repo.full_name.full_name'
      },
      { key: 'title', label: 'Title', required: true },
      { key: 'body', label: 'Body', required: false }
    ],
    perform: createIssue,
    sample: sample
  }
};
