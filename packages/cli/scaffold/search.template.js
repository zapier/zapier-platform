// find a particular <%= LOWER_NOUN %> by name
const perform = async (z, bundle) => {
  const response = await z.request({
    url: 'https://jsonplaceholder.typicode.com/posts',
    params: {
      name: bundle.inputData.name
    }
  });
  return z.JSON.parse(response.content)
};

module.exports = {
  key: '<%= KEY %>',
  noun: '<%= NOUN %>',

  display: {
    label: 'Find <%= NOUN %>',
    description: 'Finds a <%= LOWER_NOUN %>.'
  },

  operation: {
    inputFields: [
      {key: 'name', required: true, helpText: 'Find the <%= NOUN %> with this name.'}
    ],
    perform,

    sample: {
      id: 1,
      name: 'Test'
    },

    outputFields: [
      {key: 'id', label: 'ID'},
      {key: 'name', label: 'Name'}
    ]
  }
};
