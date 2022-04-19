const triggerShorthandRequest = {
  url: 'https://{{bundle.authData.subdomain}}.example.com/v2/api/recipes.json',
  method: 'GET',
  params: {
    sort_by: 'id',
    sort_order: 'DESC',
  },
};

const App = {
  // ...
  triggers: {
    example: {
      // ...
      operation: {
        // ...
        perform: triggerShorthandRequest,
      },
    },
  },
};
