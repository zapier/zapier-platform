// Search stub created by 'zapier convert'. This is just a stub - you will need to edit!

// find a particular <%= LOWER_NOUN %> by name
const search<%= CAMEL %> = (z, bundle) => {
  const responsePromise = z.request({
    url: <%= URL %>
    params: {
      EXAMPLE: bundle.inputData.EXAMPLE
    }
  });
  return responsePromise
    .then(response => JSON.parse(response.content));
};

module.exports = {
  key: '<%= KEY %>',
  noun: '<%= NOUN %>',

  display: {
    label: '<%= LABEL %>',
    description: '<%= DESCRIPTION %>',
    hidden: <%= HIDDEN %>,
    important: <%= IMPORTANT %>
  },

  operation: {
    inputFields: [
<%= FIELDS %>
    ],
<%= SAMPLE %>
    perform: search<%= CAMEL %>
  }
};
