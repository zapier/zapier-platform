// "Create" stub created by 'zapier convert'. This is just a stub - you will need to edit!

// create a particular <%= LOWER_NOUN %> by name
const create<%= CAMEL %> = (z, bundle) => {
  const responsePromise = z.request({
    method: 'POST',
    url: <%= URL %>
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
    label: '<%= LABEL =>',
    description: 'Creates a <%= LOWER_NOUN %>.'
  },

  operation: {
    inputFields: [
<%= FIELDS %>
    ],
<%= SAMPLE %>
    perform: create<%= CAMEL %>
  }
};
