// find a particular <%= LOWER_NOUN %> by name
const search<%= CAMEL %> = (z, bundle) => {
  const responsePromise = z.request({
    url: 'https://jsonplaceholder.typicode.com/posts',
    params: {
      name: bundle.inputData.name
    }
  });
  return responsePromise
    .then(response => z.JSON.parse(response.content));
};

module.exports = {
  key: '<%= KEY %>',
  noun: '<%= NOUN %>',

  display: {
    label: 'Find a <%= NOUN %>',
    description: 'Finds a <%= LOWER_NOUN %>.'
  },

  operation: {
    inputFields: [
      {key: 'name', required: true, helpText: 'Find the <%= NOUN %> with this name.'}
    ],
    perform: search<%= CAMEL %>,

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
