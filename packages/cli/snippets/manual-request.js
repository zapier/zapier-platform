const listRecipes = async (z, bundle) => {
  // Custom processing of bundle.inputData would go here...

  const httpRequestOptions = {
    url: 'https://{{bundle.authData.subdomain}}.example.com/v2/api/recipes.json',
    method: 'GET',
    params: {
      cuisine: bundle.inputData.cuisine,
    },
  };
  const response = await z.request(httpRequestOptions);
  const recipes = response.data;

  // Custom processing of recipes would go here...

  return recipes;
};

const App = {
  // ...
  triggers: {
    example: {
      // ...
      operation: {
        // ...
        perform: listRecipes,
      },
    },
  },
};
