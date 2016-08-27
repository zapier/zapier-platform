// We recommend writing your writes separate like this and rolling them
// into the App definition at the end.
module.exports = {
  key: 'recipe',

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: 'Recipe',
  display: {
    label: 'Create Recipe',
    description: 'Creates a new recipe.'
  },

  // `operation` is where the business logic goes.
  operation: {
    inputFields: [
      {key: 'name', required: true, type: 'string'},
      {key: 'directions', required: true, type: 'text'},
      {key: 'authorId', required: true, type: 'integer'}
    ],
    perform: (z, bundle) => {
      const promise = z.request({
        url: `${process.env.BASE_URL}/recipes`,
        method: 'POST',
        body: JSON.stringify({
          name: bundle.inputData.name,
          directions: bundle.inputData.directions,
          authorId: bundle.inputData.authorId,
        }),
        headers: {
          'content-type': 'application/json'
        }
      });

      return promise.then((response) => JSON.parse(response.content));
    }
  }
};
