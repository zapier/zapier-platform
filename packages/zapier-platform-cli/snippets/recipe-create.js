const createRecipeRequest = {
  url: 'http://example.com/recipes',
  method: 'POST',
  body: {
    name: 'Baked Falafel',
    style: 'mediterranean'
  }
};

const Recipe = {
  //...
  list: {
    //...
  },
  create: {
    display: {
      label: 'Add Recipe',
      description: 'Adds a new recipe to our cookbook.'
    },
    operation: {
      perform: createRecipeRequest
    }
  }
};
