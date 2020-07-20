const App = {
  // ...
  triggers: {
    example: {
      // ...
      operation: {
        // ...
        perform: async (z, bundle) => {
          const recipe = {
            name: 'Baked Falafel',
            style: 'mediterranean',
            directions: 'Get some dough....',
          };

          const options = {
            method: 'POST',
            url: 'https://example.com/api/v2/recipes.json',
            body: JSON.stringify(recipe),
          };
          const response = await z.request(options);

          // Throw and try to extract message from standard error responses
          if (response.status !== 201) {
            throw new z.errors.Error(
              `Unexpected status code ${response.status}`,
              'CreateRecipeError',
              response.status
            );
          }

          return response.data; // or response.json if you're using core v9 or older
        },
      },
    },
  },
};
