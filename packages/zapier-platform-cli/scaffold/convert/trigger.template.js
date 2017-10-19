// Trigger stub created by 'zapier convert'. This is just a stub - you will need to edit!

// triggers on <%= LOWER_NOUN %> with a certain tag
const trigger<%= CAMEL %> = (z, bundle) => {
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
    description: 'Triggers on a new <%= LOWER_NOUN %>.'
  },

  operation: {
    inputFields: [
<%= FIELDS %>
    ],
<%= SAMPLE %>
    perform: trigger<%= CAMEL %>
  }
};
