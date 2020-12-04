const test = async (z /*, bundle */) => {
  // Normally you want to make a request to an endpoint that is either specifically designed to test auth, or one that
  // every user will have access to, such as an account or profile endpoint like /me.
  // In this example, we'll hit httpbin, which validates the Authorization Header against the arguments passed in the URL path
  const response = await z.request({
    url: 'https://auth-json-server.zapier-staging.com/me',
  });
  return response;
};

const Authentication = {
  type: 'basic',

  // The test method allows Zapier to verify that the credentials a user provides are valid. We'll execute this
  // method whenever a user connects their account for the first time.
  test,
  // assuming "username" is a key returned from the test
  connectionLabel: '{{username}}',
};

export default Authentication;
