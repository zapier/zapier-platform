const sample = require('../samples/sample_repo_list');

const triggerRepo = (z, bundle) => {
  const responsePromise = z.request({
    url: 'https://api.github.com/user/repos?per_page=100'
  });
  return responsePromise
    .then(response => JSON.parse(response.content));
};

module.exports = {
  key: 'repo',
  noun: 'Repo',

  display: {
    label: 'Get Repo',
    hidden: true,
    description: 'The only purpose of this trigger is to populate the dropdown list of repos in the UI, thus, it\'s hidden.'
  },

  operation: {
    inputFields: [

    ],
    perform: triggerRepo,
    sample: sample
  }
};
