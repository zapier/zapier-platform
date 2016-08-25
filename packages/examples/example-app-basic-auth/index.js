/*
Welcome to the Zapier Basic Auth example app!
This app does a simple auth test to showcase how Zapier will automatically add the authorization header if your app
is configured to use HTTP Basic Auth.
*/

const baseURL = 'http://httpbin.org';

const App = {
  // This is just shorthand to reference the installed dependencies you have. Zapier will
  // need to know these before we can upload
  version: require('./package.json').version,
  platformVersion: require('./package.json').dependencies['@zapier/zapier-platform-core'],

  authentication: {
    type: 'basic',
    // The test method allows Zapier to verify that the credentials a user provides are valid. We'll execute this
    // method whenver a user connects their account for the first time.
    test: (z, bundle) => {
      // Normally you want to make a request to an endpoint that is either specifically designed to test auth, or one that
      // every user will have access to, such as an account or profile endpoint like /me.
      // In this example, we'll hit httpbin, which validates the Authorization Header against the arguments passed in the URL path
      const promise = z.request({
        url: `${baseURL}/basic-auth/user/passwd`,
      });

      // This method can return any truthy value to indicate the credentials are valid.
      // Raise an error to show
      return promise.then((response) => {
        if (response.status === 401) {
          throw new Error('The username and/or password you supplied is incorrect');
        }
        return response;
      });
    }
  },

  beforeRequest: [

  ],

  afterResponse: [

  ],

  resources: {

  },

  // If you want your trigger to show up, you better include it here!
  triggers: {

  },

  // If you want your searches to show up, you better include it here!
  searches: {

  },

  // If you want your writes to show up, you better include it here!
  writes: {

  }
};

// Finally, export the app.
module.exports = App;
