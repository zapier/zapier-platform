const Recipe = {
  key: 'recipe',
  // ...
  list: {
    // ...
  },
  create: {
    display: {
      label: 'Add Recipe',
      description: 'Adds a new recipe to our cookbook.',
    },
    operation: {
      perform: {
        method: 'POST',
        url: 'https://example.com/recipes',
        body: {
          name: 'Baked Falafel',
          style: 'mediterranean',
        },
      },
    },
  },
};
