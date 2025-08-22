module.exports = {
  key: 'recipe',
  type: 'search',

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: 'Recipe',
  display: {
    label: 'Find a Recipe',
    description: 'Search for recipe by cuisine style.',
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
        helpText:
          'Cuisine style to limit to the search to (i.e. mediterranean or italian).',
      },
    ],

    perform: (z, bundle) => {
      const url = 'https://auth-json-server.zapier-staging.com/recipes';

      // Put the search value in a query param. The details of how to build
      // a search URL will depend on how your API works.
      const options = {
        params: {
          style: bundle.inputData.style,
        },
      };

      return z.request(url, options).then((response) => response.data);
    },

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

    // If the resource can have fields that are custom on a per-user basis, define a function to fetch the custom
    // field definitions. The result will be used to augment the sample.
    // outputFields: () => { return []; }
    // Alternatively, a static field definition should be provided, to specify labels for the fields
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
