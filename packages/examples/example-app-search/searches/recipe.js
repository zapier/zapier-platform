module.exports = {
  key: 'recipe',

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: 'Recipe',
  display: {
    label: 'Search Recipes',
    description: 'Search for recipes.'
  },

  // `operation` is where we make the call to your API to do the search
  operation: {
    // This search only has one search field. Your searches might have just one, or many
    // search fields.
    inputFields: [
      {
        key: 'style',
        type: 'string',
        label: 'Style',
        helpText: 'Recipe style - mediterranean, italian, etc'
      }
    ],

    perform: (z, bundle) => {
      const url = `${process.env.BASE_URL}/recipes`;

      // Put the search value in a query param. The details of how to build
      // a search URL will depend on how your API works.
      const options = {
        params: {
          search: bundle.inputData.style
        }
      };

      return z.request(url, options)
        .then(response => JSON.parse(response.content));
    }
  }
};
