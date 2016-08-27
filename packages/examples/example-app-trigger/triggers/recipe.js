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

    perform: (z, bundle) => {
      // `z.console.log()` is similar to `console.log()`.
      z.console.log('console says hello world!');

      // You can build requests and our client will helpfully inject all the variables
      // you need to complete. You can also register middleware to control this.
      const promise = z.request({
        url: `${process.env.BASE_URL}/recipes`,
        params: {
          style: bundle.inputData.style
        }
      });

      // You may return a promise or a normal data structure from any perform method.
      return promise.then((response) => JSON.parse(response.content));
    }
  }
};
