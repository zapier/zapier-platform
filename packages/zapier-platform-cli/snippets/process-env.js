const listExample = (z, bundle) => {
  const httpOptions = {
    headers: {
      'my-header': process.env.MY_SECRET_VALUE
    }
  };
  return z.request('http://example.com/api/v2/recipes.json', httpOptions);
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
