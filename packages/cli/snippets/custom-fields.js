const recipeFields = async (z, bundle) => {
  const response = await z.request('https://example.com/api/v2/fields.json');

  // Call response.throwForStatus() if you're using zapier-platform-core v9 or older

  // Should return an array like [{"key":"field_1"},{"key":"field_2"}]
  return response.data; // response.json if you're using core v9 or older
};

const App = {
  // ...
  creates: {
    create_recipe: {
      // ...
      operation: {
        // an array of objects is the simplest way
        inputFields: [
          {
            key: 'title',
            required: true,
            label: 'Title of Recipe',
            helpText: 'Name your recipe!',
          },
          {
            key: 'style',
            required: true,
            choices: { mexican: 'Mexican', italian: 'Italian' },
          },
          recipeFields, // provide a function inline - we'll merge the results!
        ],
        perform: () => {},
      },
    },
  },
};
