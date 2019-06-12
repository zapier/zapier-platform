// find a particular recipe by name
const searchRecipe = (z, bundle) => {
  const responsePromise = z.request({
    url: 'https://jsonplaceholder.typicode.com/posts',
    params: {
      name: bundle.inputData.name
    }
  });
  return responsePromise
    .then(response => z.JSON.parse(response.content));
};

module.exports = {
  key: 'recipe',
  noun: 'Recipe',

  display: {
    label: 'Find a Recipe',
    description: 'Finds a recipe.'
  },

  operation: {
    inputFields: [
      {key: 'name', required: true, helpText: 'Find the Recipe with this name.'}
    ],
    perform: searchRecipe,

    sample: {
      id: 1,
      name: 'Test'
    },

    outputFields: [
      {key: 'id', label: 'ID'},
      {key: 'name', label: 'Name'}
    ]
  }
};
