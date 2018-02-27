const listExample = (z, bundle) => {
  const httpOptions = {
    headers: {
      'my-header': process.env.MY_SECRET_VALUE
    }
  };
  const response = z.request(
    'http://example.com/api/v2/recipes.json',
    httpOptions
  );
  return response.then(res => res.json);
};

const App = {
  // ...
  triggers: {
    example: {
      noun: '{{process.env.MY_NOUN}}',
      operation: {
        // ...
        perform: listExample
      }
    }
  }
};
