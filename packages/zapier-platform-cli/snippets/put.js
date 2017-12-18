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
            .request('http://example.com/api/v2/recipes.json', options)
            .then(response => {
              if (response.status !== 201) {
                throw new Error(`Unexpected status code ${response.status}`);
              }
            });
        }
      }
    }
  }
};
