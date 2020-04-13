const listExample = (z, bundle) => {
  const customHttpOptions = {
    headers: {
      'my-header': 'from zapier'
    }
  };

  return z
    .request('https://example.com/api/v2/recipes.json', customHttpOptions)
    .then(response => {
      response.throwForStatus();

      const recipes = z.JSON.parse(response.content);
      // do any custom processing of recipes here...

      return recipes;
    });
};

const App = {
  // ...
  triggers: {
    example: {
      // ...
      operation: {
        // ...
        perform: listExample
      }
    }
  }
};
