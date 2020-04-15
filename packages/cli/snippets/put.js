const App = {
  // ...
  triggers: {
    example: {
      // ...
      operation: {
        // ...
        perform: (z, bundle) => {
          const recipe = {
            name: 'Baked Falafel',
            style: 'mediterranean',
            directions: 'Get some dough....'
          };

          const options = {
            method: 'POST',
            body: JSON.stringify(recipe)
          };

          return z
            .request('https://example.com/api/v2/recipes.json', options)
            .then(response => {
              // throw and try to extract message from standard error responses
              response.throwForStatus();
              if (response.status !== 201) {
                throw new z.errors.Error(
                  `Unexpected status code ${response.status}`,
                  'CreateRecipeError',
                  response.status
                );
              }
            });
        }
      }
    }
  }
};
