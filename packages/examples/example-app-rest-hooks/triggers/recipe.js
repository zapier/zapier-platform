const subscribeHook = (z, bundle) => {
  // `z.console.log()` is similar to `console.log()`.
  z.console.log('console says hello world!');

  // bundle.targetUrl has the Hook URL this app should call when a recipe is created.
  const data = {
    url: bundle.targetUrl,
    style: bundle.inputData.style
  };

  // You can build requests and our client will helpfully inject all the variables
  // you need to complete. You can also register middleware to control this.
  const promise = z.request({
    url: 'http://57b20fb546b57d1100a3c405.mockapi.io/api/hooks',
    method: 'POST',
    body: JSON.stringify(data)
  });

  // You may return a promise or a normal data structure from any perform method.
  return promise.then((response) => JSON.parse(response.content));
};

const unsubscribeHook = (z, bundle) => {
  // bundle.subscribeData contains the parsed response JSON from the subscribe
  // request made initially.
  const hookId = bundle.subscribeData.id;

  // You can build requests and our client will helpfully inject all the variables
  // you need to complete. You can also register middleware to control this.
  const promise = z.request({
    url: `http://57b20fb546b57d1100a3c405.mockapi.io/api/hooks/${hookId}`,
    method: 'DELETE',
  });

  // You may return a promise or a normal data structure from any perform method.
  return promise.then((response) => JSON.parse(response.content));
};

const getRecipe = (z, bundle) => {
  // bundle.cleanedRequest will include the parsed JSON object (if it's not a
  // test poll) and also a .querystring property with the URL's query string.
  const recipe = {
    id: bundle.cleanedRequest.id,
    name: bundle.cleanedRequest.name,
    directions: bundle.cleanedRequest.directions,
    style: bundle.cleanedRequest.style,
    authorId: bundle.cleanedRequest.authorId,
    createdAt: bundle.cleanedRequest.createdAt
  };

  return [recipe];
};

const getFallbackRealRecipe = (z, bundle) => {
  // For the test poll, you should get some real data, to aid the setup process.
  const promise = z.request({
    url: 'http://57b20fb546b57d1100a3c405.mockapi.io/api/recipes/',
    params: {
      style: bundle.inputData.style
    }
  });
  return promise.then((response) => JSON.parse(response.content));
};

// We recommend writing your triggers separate like this and rolling them
// into the App definition at the end.
module.exports = {
  key: 'recipe',

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: 'Recipe',
  display: {
    label: 'New Recipe',
    description: 'Trigger when a new recipe is added.'
  },

  // `operation` is where the business logic goes.
  operation: {

    // `inputFields` can define the fields a user could provide,
    // we'll pass them in as `bundle.inputData` later.
    inputFields: [
      {key: 'style', type: 'string'}
    ],

    type: 'hook',

    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,

    perform: getRecipe,
    performList: getFallbackRealRecipe,

    sample: {
      id: 1,
      name: 'Example Name',
      directions: 'Example Directions',
      style: 'Example Style',
      authorId: 1,
      createdAt: 1471984229
    }
  }
};
