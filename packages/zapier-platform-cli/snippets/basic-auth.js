const authentication = {
  type: 'basic',
  // "test" could also be a function
  test: {
    url: 'https://example.com/api/accounts/me.json'
  }
  // you can provide additional fields, but we'll provide `username`/`password` automatically
};

const App = {
  // ...
  authentication: authentication,
  // ...
};
