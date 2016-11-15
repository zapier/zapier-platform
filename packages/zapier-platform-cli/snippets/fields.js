const App = {
  //...
  creates: {
    create_recipe: {
      key: 'create_recipe',
      noun: 'Recipe',
      display: {
        label: 'Create Recipe',
        helpText: 'Create a new recipe.'
      },
      operation: {
        // an array of objects is the simplest way
        inputFields: [
          {key: 'title', required: true, label: 'Title of Recipe', helpText: 'Name your recipe!'},
          {key: 'style', required: true, choices: {mexican: 'Mexican', italian: 'Italian'}}
        ],
        perform: () => {}
      }
    }
  }
};
