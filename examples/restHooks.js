const subscribeHook = async (z, bundle) => {
  // bundle.targetUrl is the url to which your app should send data when a recipe is created
  // the rest of the data can be anything you want, such an event type or other configuration data
  const data = {
    url: bundle.targetUrl,
    style: bundle.inputData.style,
  };

  const options = {
    url: 'https://57b20fb546b57d1100a3c405.mockapi.io/api/hooks',
    method: 'POST',
    body: data,
  };

  // data returned from this object will be available in `performUnsubscribe` as `bundle.subscribeData`
  const response = await z.request(options);
  return response.data;
};

const unsubscribeHook = async (z, bundle) => {
  // bundle.subscribeData is whatever was returned from `subscribeHook`
  const hookId = bundle.subscribeData.id;

  const options = {
    url: `https://57b20fb546b57d1100a3c405.mockapi.io/api/hooks/${hookId}`,
    method: 'DELETE',
  };

  // You may return a promise or a normal data structure from any perform method.
  const response = await z.request(options);
  return response.data;
};

// this function runs when a hook is recieved on a live zap (or if testing with a hook)
const getRecipe = (z, bundle) => {
  // bundle.cleanedRequest has the hook contents
  // bundle.querystring has the querystring from the hook url for legacy reasons
  const recipe = {
    id: bundle.cleanedRequest.id,
    name: bundle.cleanedRequest.name,
    directions: bundle.cleanedRequest.directions,
    style: bundle.cleanedRequest.style,
    authorId: bundle.cleanedRequest.authorId,
    createdAt: bundle.cleanedRequest.createdAt,
  };

  // trigger methods must return arrays
  return [recipe];
};

// when setting up a zap, we'll poll for data instead of waiting for a hook
// it's important that this be the same shape as the hooks you'll eventually send
const getFallbackRealRecipe = async (z, bundle) => {
  const options = {
    url: 'https://57b20fb546b57d1100a3c405.mockapi.io/api/recipes/',
    params: {
      style: bundle.inputData.style,
    },
  };

  const response = await z.request(options);

  return response.data;
};

module.exports = {
  key: 'recipe',

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: 'Recipe',
  display: {
    label: 'New Recipe',
    description: 'Trigger when a new recipe is added.',
  },

  // `operation` is where the business logic goes.
  operation: {
    // `inputFields` can define the fields a user could provide,
    // we'll pass them in as `bundle.inputData` in your perform methods.
    inputFields: [
      {
        key: 'style',
        type: 'string',
        helpText: 'Which styles of cuisine this should trigger on.',
      },
    ],

    type: 'hook',

    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,

    perform: getRecipe,
    performList: getFallbackRealRecipe,

    // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
    // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
    // returned records, and have obviously dummy values that we can show to any user.
    sample: {
      id: 1,
      createdAt: 1472069465,
      name: 'Best Spagetti Ever',
      authorId: 1,
      directions: '1. Boil Noodles\n2.Serve with sauce',
      style: 'italian',
    },

    // If the item can have fields with custom names (such as a spreadsheet or form app might)
    // they can be fetched in the `ouputFields` function.

    // outputFields: () => { return []; }

    // Alternatively, a static field definition should be provided to provide nice labels for the output
    outputFields: [
      { key: 'id', label: 'ID' },
      { key: 'createdAt', label: 'Created At' },
      { key: 'name', label: 'Name' },
      { key: 'directions', label: 'Directions' },
      { key: 'authorId', label: 'Author ID' },
      { key: 'style', label: 'Style' },
    ],
  },
};
