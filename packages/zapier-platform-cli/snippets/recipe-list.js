const listRecipesRequest = {
  url: 'http://example.com/recipes'
};

const Recipe = {
  //...
  list: {
    display: {
      label: 'New Recipe',
      description: 'Triggers when a new recipe is added.'
    },
    operation: {
      perform: listRecipesRequest
    }
  }
};
