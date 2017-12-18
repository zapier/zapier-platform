const authentication = {
  type: 'digest',
  // "test" could also be a function
  test: {
    url: 'https://example.com/api/accounts/me.json'
  },
  connectionLabel: (z, bundle) => {
    // Can also be a string, check basic auth above for an example
    // bundle.inputData has whatever comes back from the .test function/request, assuming it returns a JSON object
    return bundle.inputData.email;
  }
  // you can provide additional fields, but Zapier will provide `username`/`password` automatically
};

const App = {
  // ...
  authentication: authentication
  // ...
};
