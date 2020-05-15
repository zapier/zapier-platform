const listExample = async (z, bundle) => {
  const httpOptions = {
    headers: {
      'my-header': process.env.MY_SECRET_VALUE,
    },
  };
  const response = await z.request(
    'https://example.com/api/v2/recipes.json',
    httpOptions
  );
  return response.data;
};

const App = {
  // ...
  triggers: {
    example: {
      noun: '{{process.env.MY_NOUN}}',
      operation: {
        // ...
        perform: listExample,
      },
    },
  },
};
