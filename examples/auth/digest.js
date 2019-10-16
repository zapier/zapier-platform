const test = async (z /*, bundle */) => {
  // Normally you want to make a request to an endpoint that is either specifically designed to test auth, or one that
  // every user will have access to, such as an account or profile endpoint like /me.

  // In this example, we'll hit httpbin, which validates the Authorization Header against the arguments passed in the URL path
  const response = await z.request({
    url: 'https://httpbin.org/digest-auth/auth/myuser/mypass'
  });

  if (response.status === 401) {
    // This message is surfaced to the user
    throw new Error('The username and/or password you supplied is incorrect');
  }

  // anything truthy indicates the credentials are valid. Data returned from this test is available to the connection label
  return response;
};

module.exports = {
  // 'digest' automatically creates username & password auth fields
  // it also creates and registers the default middleware
  type: 'digest',

  // The test method allows Zapier to verify that the credentials a user provides are valid. We'll execute this
  // method whenver a user connects their account for the first time.
  test: test,

  // this can be a "{{string}}" or a function
  connectionLabel: '{{username}}'
};
