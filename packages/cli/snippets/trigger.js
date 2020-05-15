const App = {
  // ...
  triggers: {
    new_recipe: {
      key: 'new_recipe', // uniquely identifies the trigger
      noun: 'Recipe', // user-friendly word that is used to refer to the resource
      // `display` controls the presentation in the Zapier Editor
      display: {
        label: 'New Recipe',
        description: 'Triggers when a new recipe is added.',
      },
      // `operation` implements the API call used to fetch the data
      operation: {
        perform: {
          url: 'https://example.com/recipes',
        },
      },
    },
    another_trigger: {
      // Another trigger definition...
    },
  },
};
