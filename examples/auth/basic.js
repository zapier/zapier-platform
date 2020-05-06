const test = (z /*, bundle */) =>
  z.request({
    // Normally you want to make a request to an endpoint that is either specifically designed to test auth, or one that
    // every user will have access to, such as an account or profile endpoint like /me.
    url: 'https://auth-json-server.zapier-staging.com/me'
  });

module.exports = {
  config: {
    // 'basic' automatically creates username & password auth fields
    // it also creates and registers the default middleware
    type: 'basic',

    // The test method allows Zapier to verify that the credentials a user provides are valid. We'll execute this
    // method whenver a user connects their account for the first time.
    test,

    // this can be a "{{string}}" or a function
    connectionLabel: '{{bundle.inputData.username}}'
  }
};
