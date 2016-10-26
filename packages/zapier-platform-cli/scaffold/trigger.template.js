// triggers on <%= LOWER_NOUN %> with a certain tag
const trigger<%= CAMEL %> = (z, bundle) => {
  const responsePromise = z.request({
    url: 'http://example.com/api/<%= KEY %>s.json',
    params: {
      tag: bundle.inputData.tagName
    }
  });
  return responsePromise
    .then(response => JSON.parse(response.content));
};

module.exports = {
  key: '<%= KEY %>',
  noun: '<%= NOUN %>',

  display: {
    label: 'Get <%= NOUN %>',
    description: 'Triggers on a new <%= LOWER_NOUN %>.'
  },

  operation: {
    inputFields: [
      <%= INPUT_FIELDS %>
    ],
    perform: trigger<%= CAMEL %>
  }
};
