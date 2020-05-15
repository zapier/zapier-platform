const getConnectionLabel = (z, bundle) => {
  // bundle.inputData will contain what the "test" URL (or function) returns
  return bundle.inputData.username;
};

const authentication = {
  type: 'digest',
  // "test" could also be a function
  test: {
    url: 'https://example.com/api/accounts/me.json',
  },
  connectionLabel: getConnectionLabel,

  // you can provide additional fields, but we'll provide `username`/`password` automatically
};

const App = {
  // ...
  authentication: authentication,
  // ...
};
