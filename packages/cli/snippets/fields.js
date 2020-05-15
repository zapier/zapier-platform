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
        ],
        perform: () => {},
      },
    },
  },
};
