// create a particular recipe by name
const createRecipe = (z, bundle) => {
  const responsePromise = z.request({
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    body: JSON.stringify({
      name: bundle.inputData.name
    })
  });
  return responsePromise
    .then(response => z.JSON.parse(response.content));
};

module.exports = {
  key: 'recipe',
  noun: 'Recipe',

  display: {
    label: 'Create Recipe',
    description: 'Creates a recipe.'
  },

  operation: {
    inputFields: [
      {key: 'name', required: true},
      {key: 'favorite', required: true}
    ],
    perform: createRecipe,

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
