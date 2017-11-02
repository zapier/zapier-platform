// "Create" stub created by 'zapier convert'. This is just a stub - you will need to edit!

const makeRequest = (z, bundle) => {
  const responsePromise = z.request({
    method: 'POST',
    url: '<%= URL %>',
    data: JSON.stringify({
      EXAMPLE: bundle.inputData.EXAMPLE
    })
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
    perform: makeRequest
  }
};
