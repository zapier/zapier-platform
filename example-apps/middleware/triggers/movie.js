module.exports = {
  key: 'movie',

  noun: 'Movie',
  display: {
    label: 'New Movie',
    description: 'Trigger when a new movie is added.',
  },

  operation: {
    perform: {
      url: 'https://auth-json-server.zapier-staging.com/movies',
      params: {
        // Just a demo, this is NOT how you normally do authentication.
        // Refer to https://docs.zapier.com/platform/reference/cli-docs#authentication
        api_key: 'secret',
      },
    },

    // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
    // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
    // returned records, and have obviously dummy values that we can show to any user.
    sample: {
      id: 1,
      releaseDate: 1472069465,
      title: 'Test Title',
      genre: 'Sci-Fi',
    },

    // If the resource can have fields that are custom on a per-user basis, define a function to fetch the custom
    // field definitions. The result will be used to augment the sample.
    // outputFields: () => { return []; }
    // Alternatively, a static field definition should be provided, to specify labels for the fields
    outputFields: [
      { key: 'id', label: 'ID' },
      { key: 'releaseDate', label: 'Release Date' },
      { key: 'title', label: 'Title' },
      { key: 'genre', label: 'Genre' },
    ],
  },
};
