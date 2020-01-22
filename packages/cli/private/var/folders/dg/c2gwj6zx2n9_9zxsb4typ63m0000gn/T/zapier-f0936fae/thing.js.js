// triggers on a new thing with a certain tag
const perform = async (z, bundle) => {
  const response = await z.request({
    url: 'https://jsonplaceholder.typicode.com/posts',
    params: {
      tag: bundle.inputData.tagName
    }
  });
  return z.JSON.parse(response.content);
};

module.exports = {
  key: 'thing',
  noun: 'Thing',

  display: {
    label: 'Get Thing',
    description: 'Triggers when a new thing is created.'
  },

  operation: {
    perform,

    inputFields: [],

    sample: {
      id: 1,
      name: 'Test'
    },

    outputFields: [
      { key: 'id', label: 'Person ID' },
      { key: 'name', label: 'Person Name' }
    ]
  }
};
