/*
Welcome to the Zapier Custom Auth example app!
This app showcases how to setup a custom authentication scheme.
It also illustrates how to add the required auth details to later requests.
*/

const baseURL = 'http://57b20fb546b57d1100a3c405.mockapi.io/api';

const testAuth = (z, bundle) => {
  // Normally you want to make a request to an endpoint that is either specifically designed to test auth, or one that
  // every user will have access to, such as an account or profile endpoint like /me.
  // In this example, we'll hit httpbin, which validates the Authorization Header against the arguments passed in the URL path
  const promise = z.request({
    url: `${baseURL}/recipes`,
  });

  // This method can return any truthy value to indicate the credentials are valid.
  // Raise an error to show
  return promise.then((response) => {
    if (response.status === 401) {
      throw new Error('The API Key you supplied is invalid');
    }
    return response;
  });
};

const App = {
  // This is just shorthand to reference the installed dependencies you have. Zapier will
  // need to know these before we can upload
  version: require('./package.json').version,
  platformVersion: require('./package.json').dependencies['@zapier/zapier-platform-core'],

  authentication: {
    type: 'custom',
    // Define any auth fields your app requires here. The user will be prompted to enter this info when
    // they connect their account.
    fields: [
      {key: 'apiKey', label: 'API Key', required: true, type: 'string'}
    ],
    // The test method allows Zapier to verify that the credentials a user provides are valid. We'll execute this
    // method whenver a user connects their account for the first time.
    test: testAuth
  },

  beforeRequest: [
    // To include the API key header on all outbound requests, simply define a function here.
    // It runs runs before each request is sent out, allowing you to make tweaks to the request in a centralized spot
    (request, z, bundle) => {
      if (bundle.authData.apiKey) {
        if (request.params) {
          request.params.api_key = bundle.authData.apiKey;
        } else {
          request.params = {
            api_key: bundle.authData.apiKey
          };
        }
      }
      return request;
    }
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
