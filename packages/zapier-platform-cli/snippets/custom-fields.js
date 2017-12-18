const recipeFields = (z, bundle) => {
  const response = z.request('http://example.com/api/v2/fields.json');
  // json is is [{"key":"field_1"},{"key":"field_2"}]
  return response.then(res => res.json);
};

const App = {
  //...
  creates: {
    create_recipe: {
      //...
      operation: {
        // an array of objects is the simplest way
        inputFields: [
          {
            key: 'title',
            required: true,
            label: 'Title of Recipe',
            helpText: 'Name your recipe!'
          },
          {
            key: 'style',
            required: true,
            choices: { mexican: 'Mexican', italian: 'Italian' }
          },
          recipeFields // provide a function inline - we'll merge the results!
        ],
        perform: () => {}
      }
    }
  }
};
