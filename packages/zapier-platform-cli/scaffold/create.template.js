// create a particular <%= LOWER_NOUN %> by name
const create<%= CAMEL %> = (z, bundle) => {
  const responsePromise = z.request({
    method: 'POST',
    url: 'http://example.com/api/<%= KEY %>s.json',
    data: JSON.stringify({
      name: bundle.inputData.name
    })
  });
  return responsePromise
    .then(response => JSON.parse(response.content));
};

module.exports = {
  key: '<%= KEY %>',
  noun: '<%= NOUN %>',

  display: {
    label: 'Create <%= NOUN %>',
    description: 'Creates a <%= LOWER_NOUN %>.'
  },

  operation: {
    inputFields: [
      {key: 'name', required: true}
    ],
    perform: create<%= CAMEL %>
  },

  sample: {
    id: 1,
    name: 'Test'
  },

  outputFields: [
    {key: 'id', label: 'ID'},
    {key: 'name', label: 'Name'}
  ]
};
