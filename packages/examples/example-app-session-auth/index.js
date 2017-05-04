const authentication = require('./authentication');

// To include the session key header on all outbound requests, simply define a function here.
// It runs runs before each request is sent out, allowing you to make tweaks to the request in a centralized spot
const includeSessionKeyHeader = (request, z, bundle) => {
  if (bundle.authData.sessionKey) {
    request.headers = request.headers || {};
    request.headers['X-Session-Key'] = bundle.authData.sessionKey;
  }
  return request;
};

// If we get a response and it is a 401, we can raise a special error telling Zapier to retry this after another exchange.
const sessionRefreshIf401 = (response, z, bundle) => {
  if (bundle.authData.sessionKey) {
    if (response.status === 401) {
      throw new z.errors.RefreshAuthError('Session key needs refreshing.');
    }
  }
  return response;
};

const App = {
  // This is just shorthand to reference the installed dependencies you have. Zapier will
  // need to know these before we can upload
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  authentication: authentication,

  beforeRequest: [
    includeSessionKeyHeader
  ],

  afterResponse: [
    sessionRefreshIf401
  ],

  resources: {
  },

  // If you want your trigger to show up, you better include it here!
  triggers: {
    recipe: {
      key: 'recipe',
      noun: 'Recipe',
      display: {
        label: 'New Recipe',
        description: 'Trigger when a new recipe is added.'
      },
      operation: {
        inputFields: [
          {key: 'style', type: 'string'}
        ],
        perform: function() { return [{id: 1, name: 'A food!'}] },
        
        // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
        // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
        // returned records, and have obviously dummy values that we can show to any user.
        sample: {
          id: 1,
          createdAt: 1472069465,
          name: 'Best Spagetti Ever',
          authorId: 1,
          directions: '1. Boil Noodles\n2.Serve with sauce',
          style: 'italian'
        },

        // If the resource can have fields that are custom on a per-user basis, define a function to fetch the custom
        // field definitions. The result will be used to augment the sample.
        // outputFields: () => { return []; }
        // Alternatively, a static field definition should be provided, to specify labels for the fields
        outputFields: [
          {key: 'id', label: 'ID'},
          {key: 'createdAt', label: 'Created At'},
          {key: 'name', label: 'Name'},
          {key: 'directions', label: 'Directions'},
          {key: 'authorId', label: 'Author ID'},
          {key: 'style', label: 'Style'}
        ]
      }
    }
  },

  // If you want your searches to show up, you better include it here!
  searches: {
  },

  // If you want your creates to show up, you better include it here!
  creates: {
  }
};

// Finally, export the app.
module.exports = App;
