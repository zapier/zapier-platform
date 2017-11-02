// Search stub created by 'zapier convert'. This is just a stub - you will need to edit!

const getList = (z, bundle) => {
  const responsePromise = z.request({
    url: '<%= URL %>'
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
    perform: getList
  }
};
