const test = (z /*, bundle */) =>
  // Normally you want to make a request to an endpoint that is either specifically designed to test auth, or one that
  // every user will have access to, such as an account or profile endpoint like /me.
  // In this example, we'll hit httpbin, which validates the Authorization Header against the arguments passed in the URL path

  // This method can return any truthy value to indicate the credentials are valid.
  // Raise an error to show
  z.request({
    url: 'https://httpbin.org/digest-auth/auth/myuser/mypass'
  });

module.exports = {
  type: 'digest',

  // The test method allows Zapier to verify that the credentials a user provides are valid. We'll execute this
  // method whenver a user connects their account for the first time.
  test: test,
  // assuming "username" is a key returned from the test
  connectionLabel: '{{username}}'
};
